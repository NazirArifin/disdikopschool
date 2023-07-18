<script lang="ts">
declare const $: any;
declare const alertify: any;
</script>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import Header from '../components/Header.vue';
import { useMainStore } from '../store/main';
import FpModal from '../components/FpModal.vue';
import { Logs, PegawaiType, SdkConfigType, Shift } from '../helpers/types';
import { format } from 'date-fns';
import { useToast } from 'vue-toastification';
import Sdk from '../services/sdk';
import { ipcRenderer } from 'electron';
import Api from '../helpers/api';
import MyDb from '../services/mydb';
import { conn, initJsStore } from '../services/idb';
import schedule from 'node-schedule';
import IjinModal from '../components/IjinModal.vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import { id } from 'date-fns/esm/locale';

const mainStore = useMainStore();
const toast = useToast();
const sekolah = computed(() => mainStore.user.sekolah.nama);
const idSekolah = computed(() => mainStore.user.sekolah.id);
const apiService = new Api();
const empDb = new MyDb(initJsStore, conn, 'Pegawai');
const syncDb = new MyDb(initJsStore, conn, 'Sinkron');

const reportDate = ref<Date[]>([new Date(), new Date()]);
const activeMenu = ref('sinkron');
const sinkronDate = ref('');
const dbActive = ref(false);
const sdkActive = ref(false);
const sdk = ref<Sdk | null>(null);
const sdkConfig = ref<SdkConfigType | null>(null);

function changeMenu(menu: string) {
  activeMenu.value = menu;
}

/**
 * BAGIAN SYNCRON ABSENSI
 */
const ableSync = computed(() => {
  if (! shiftData.shift) {
    return false;
  }
  const today = sinkronDate.value.split('/').reverse().join('-');
  const now = parseFloat(format(new Date(), 't'));
  // diantara sync masuk
  if (now >= parseFloat(format(new Date(`${today} ${shiftData.shift.scanIn}`), 't')) && now <= parseFloat(format(new Date(`${today} ${shiftData.shift.scanInEnd}`), 't'))) {
    return true;
  }
  // diantara sync pulang
  if (now >= parseFloat(format(new Date(`${today} ${shiftData.shift.scanOut}`), 't')) && now <= parseFloat(format(new Date(`${today} ${shiftData.shift.scanOutEnd}`), 't'))) {
    return true;
  }
  return false;
});
const syncList = ref<any>([]);
const lastSync = computed(() => {
  if (syncList.value.length === 0) {
    return '-';
  }
  return format(new Date(syncList.value[0].date), 'EEEE, dd MMMM yyyy HH.mm', { locale: id });
});
const inIdling = ref(false);

function activateIdling(): void {
  inIdling.value = true;
  setTimeout(() => {
    inIdling.value = false;
  }, 5 * 60 * 1000);
}
async function loadSyncData(): Promise<void> {
  syncList.value = await syncDb.getAll(365) || [];
}

async function syncronize(): Promise<void> {
  if (! ableSync.value) {
    toast.error('Bukan waktu sinkron absensi');
    return;
  }

  const today = sinkronDate.value.split('/').reverse().join('-');
  let logs: Logs[] = [];
  try {
    mainStore.showSpinner('MENGAMBIL ABSENSI');

    // prioritas pengambilan data log
    let tempLogs: any[] = [];
    let useSdk = false;
    if (sdkActive.value && isAsyncActive.value) {
      // jika kosong dari sdk, maka akan di throw ke catch block
      tempLogs = await sdk?.value?.getScanLog(today);
      useSdk = true;
    } else {
      tempLogs = await ipcRenderer.invoke('db-get-scan-log', today);
    }

    // jika tempLogs bukan array, maka kita throw ke catch block
    if (! Array.isArray(tempLogs)) {
      if (typeof(tempLogs) === 'string') {
        throw new Error(tempLogs);
      } else {
        throw new Error('Gagal mengambil data absensi');
      }
    }
    // jika kosong dari database, maka akan di throw ke catch block
    if (tempLogs.length == 0) {
      throw new Error('Tidak ada data absensi untuk hari ini');
    }

    // variabel logs berisi templog yang raw di filter dan di map
    // sumbernya bisa dari database atau ketika sdk ada data
    logs = tempLogs.filter((v: any) => {
      const p = pegawaiList.value.find((p: PegawaiType) => p.pin === v.pin);
      return p?.active;
    }).map((v: any) => {
      const p = pegawaiList.value.find((p: PegawaiType) => p.pin === v.pin);
      return {
        pin: p?.nip || '', name: p?.nama || '', alias: p?.namaSingkat || '',
        dateTime: format(new Date((v.scan_date + '').replace(/\./g, ':')), 'yyyy-MM-dd HH:mm:ss')
      }
    });

    if (useSdk) {
      // 1.1.8 tulis ke file untuk di append hanya jika yang pakai sdk, jika pakai database tidak perlu
      // karena di database selalu ada data untuk hari ini
      // const data = await ipcRenderer.invoke('write-log', '2021-09-11', [ { 'scan_date': '2021-08-11 10.00.00', pin: '1212202' } ]);
      logs = await ipcRenderer.invoke('write-log', today, logs);
    }

    // jika tidak ada data baru yang dapat dikirimkan ke server maka kita throw, disebabkan oleh database kosong
    if (logs.length == 0) {
      throw new Error('');
    }

    mainStore.changeSpinMessage('MENGIRIMKAN ABSENSI KE SERVER');
    const data = await apiService.postResource('/sinkron', {
      pin: JSON.stringify(logs.map(v => v.pin)),
      name: JSON.stringify(logs.map(v => v.name)),
      alias: JSON.stringify(logs.map(v => v.alias)),
      dateTime: JSON.stringify(logs.map(v => v.dateTime))
    });
    if (data.success) {
      toast.success(`SUKSES: JUMLAH DATA TERPROSES: ${data.count}`);
      activateIdling();
      await syncDb.insert({ date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'), count: data.count });
      loadSyncData();
    }
  } catch(e: any) {
    console.log(e);
    if (typeof(e) !== 'string') {
      const message = e.toString();
      if (message == 'Object' || message == '[object Object]') {
        // error dari server
        if (Object.prototype.hasOwnProperty.call(e, 'data')) {
          toast.error(`${e.data.message.toUpperCase()}`);
          return;
        }
        // extract
        const temp = [];
        for (const key in e) {
          if (Object.prototype.hasOwnProperty.call(e, key)) {
            temp.push(`${key}: ${e[key]}`);
          }
        }
        toast.error(`${temp.join(', ')}`);
      } else {
        if (message.length > 0) {
          toast.error(`${message}`);
        } else {
          toast.error('TIDAK ADA DATA UNTUK DIPROSES');
        }
      }
    } else {
      // jika sdk kosong maka errornya akan masuk kesini
      if (e.length > 0 && e == 'Result False. Tidak ada data!') {
        // tetap harus dikirim ke server
        const logs: Logs[] = await ipcRenderer.invoke('write-log', today, []);
        if (logs.length > 0) {
          mainStore.changeSpinMessage('MENGIRIMKAN ABSENSI KE SERVER');
          const data = await apiService.postResource('/sinkron', {
            pin: JSON.stringify(logs.map(v => v.pin)),
            name: JSON.stringify(logs.map(v => v.name)),
            alias: JSON.stringify(logs.map(v => v.alias)),
            dateTime: JSON.stringify(logs.map(v => v.dateTime))
          });
          if (data.success) {
            toast.success(`SUKSES: JUMLAH DATA TERPROSES: ${data.count}`);
            activateIdling();
            await syncDb.insert({ date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'), count: data.count });
            loadSyncData();
          }
        } else {
          toast.info(e);
        }
      }
    }
  } finally {
    mainStore.hideSpinner();
  }
}

/**
 * BAGIAN AUTO SINKRON
 */
const shiftData = reactive<Shift>({ shift: { scanIn: '', scanOut: '', scanInEnd: '', scanOutEnd: '' }, tanggal: '', libur: false });
const isAsyncActive = ref(false);
const async = reactive<{
  number: string, expired: string
}>({ number: '', expired: '' });
function randomIntFromInterval(min: number, max: number): number {
  if (min > max) {
    // switch value
    const temp = min;
    min = max;
    max = temp;
  }
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// mengecek apakah sn autosync aktif
// 1.1.13 getter sdkActive dan shift untuk memastikan bahwa data shift sudah diambil dan sdk aktif
const sdkActiveAndShiftCalled = computed(() => {
  if (shiftData.tanggal.length == 0) {
    return false;
  }
  return sdkActive.value;
});
async function checkAsyncActive() {
  const sn = localStorage.getItem('asyncKey');
  if (sn) {
    const { expired, number } = JSON.parse(sn);
    async.expired = expired;
    async.number = number;
    const split = expired.split(' ');
    const date = split[0].split('-').reverse().join('-');
    const time = split[1] + ':59';
    const expiredDate = parseFloat(format(new Date(`${date} ${time}`), 't'));

    const now = parseFloat(format(new Date(), 't'));
    // jika sekarang lebih besar dari expired maka kita harus mengecek serial number
    if (now > expiredDate) {
      isAsyncActive.value = await saveAsyncNumber();
    } else {
      isAsyncActive.value = true;
    }

    // hanya jika autosync aktif kita set beberapa jam untuk sinkron
    if (isAsyncActive.value) {
      const rule = new schedule.RecurrenceRule();
      rule.dayOfWeek = [1, 2, 3, 4, 5, 6];
      rule.hour = [7, 8, 9, 10, 11, 12, 13];

      let step = randomIntFromInterval(0, 15);
      const ruleMinutes = [step];
      while (step < 60) {
        step += 15;
        ruleMinutes.push(step);
      }
      rule.minute = ruleMinutes;
      schedule.scheduleJob(rule, () => {
        syncronize();
      });
    }
  }
}
function saveAsyncNumber() {
  return new Promise<boolean>(async (resolve, reject) => {
    try {
      const data = await apiService.checkSn({ sn: async.number, sekolah: idSekolah.value });
      if (! data.valid) {
        toast.error('Kode aktivasi tidak valid');
        localStorage.removeItem('asyncKey');
        reject(false);
      } else {
        isAsyncActive.value = true;
        async.expired = format(new Date(data.until * 1000), 'dd-MM-yyyy HH:mm');
        localStorage.removeItem('asyncKey');
        localStorage.setItem('asyncKey', JSON.stringify({ number: async.number, expired: async.expired }));
        toast.success('Aktivasi berhasil');
        resolve(true);
      }
    } catch(e: any) {
      toast.error(e.toString());
      localStorage.removeItem('asyncKey');
      reject(false);
    }
  });
}

/**
 * BAGIAN DATA PEGAWAI
 */
const pegawaiList = ref<PegawaiType[]>([]);
async function syncronPegawai() {
  pegawaiList.value = [];
  try {
    // ambil data dari database atau dari sdk, diutamakan yang sdk
    let empDbLocal: any[] = [];
    if (sdkActive.value)  {
      const rows = await sdk.value?.getPegawai();
      empDbLocal = rows.Data.map((v: any) => {
        return {
          pin: v.PIN, nip: v.PIN, nama: v.Name, alias: v.Name
        }
      });
    } else {
      const rows = await ipcRenderer.invoke('db-get-pegawai');
      empDbLocal = rows.map((v: any) => {
        return {
          pin: v.pegawai, nip: v.pegawai_nip || v.pegawai_pin, nama: v.pegawai_nama, alias: v.pegawai_alias
        }
      });
    }

    let empIdb: PegawaiType[] = await empDb.getAll();
    let change = false;
    // jika data di mesin / database lebih banyak dari data di dbstore maka kita insert
    if (empDbLocal.length > empIdb.length) {
      for await (const v of empDbLocal) {
        if (empIdb.findIndex((k: any) => k.nip == v.nip) == -1) {
          const pin = v.pin || v.nip;
          const value = {
            pin: pin, nip: v.nip, nama:v.nama, namaSingkat: v.alias, active: true
          };
          await empDb.insert(value);
        }
      }
      change = true;
    }

    // jika data di mesin / database lebih sedikit dari data di dbstore maka kita delete
    if (empDbLocal.length < empIdb.length) {
      for await (const v of empIdb) {
        if (empDbLocal.findIndex((k: any) => k.nip == v.nip) == -1) {
          await empDb.delete({ id: v.id });
        }
      }
      change = true;
    }
    // jika ada perubahan maka kita ambil data terbaru
    if (change) {
      empIdb = await empDb.getAll();
    }

    // apakah ada perubahan data
    for await (const v of empIdb) {
      const i = empDbLocal.findIndex((k: any) => k.nip == v.nip);
      if (i != -1) {
        const p = empDbLocal[i];
        const o = {};
        if (p.nip != v.nip) Object.assign(o, { nip: p.nip });
        if (p.nama != v.nama) Object.assign(o, { nama: p.nama });
        if (p.alias != v.namaSingkat) Object.assign(o, { namaSingkat: p.alias });
        if (Object.keys(o).length > 0) {
          change = true;
          await empDb.update({ id: v.id }, o);
        }
      }
    }
    // jika ada perubahan maka kita ambil data terbaru
    if (change) {
      empIdb = await empDb.getAll();
    }
    pegawaiList.value = empIdb;
  } catch(e: any) {
    toast.error(e.toString());
  }
}

async function loadPegawai() {
  pegawaiList.value = await empDb.getAll();
}
function updateStatusActive(i: number) {
  const p = pegawaiList.value[i];
  empDb.update({ active: p.active }, { id: p.id });
}

/**
 * BAGIAN PENGAJUAN IJIN
 */
const jenisIjinList = ref<{ id: number, val: string }[]>([
  { id: 1, val: 'Tidak Masuk' },
  { id: 2, val: 'Datang Terlambat' },
  { id: 3, val: 'Pulang Awal' },
  { id: 4, val: 'Tidak Scan Masuk' },
  { id: 5, val: 'Tidak Scan Pulang' }
]);
const ajuanList = ref<any[]>([]);
function loadAjuan() {
  apiService.getResource('/ijin', { sekolah: idSekolah.value }).then(data => {
    ajuanList.value = data;
  }).catch(err => toast.error(err.toString()));
}
const idEdited = ref<number>(0);
function editAjuan(i: number) {
  idEdited.value = ajuanList.value[i].id;
}
function deleteAjuan(i: number) {
  alertify.confirm('Hapus Ajuan', 'Apakah Anda yakin akan data ajuan ijin ini?', async () => {
    const item = ajuanList.value[i];
    apiService.deleteResource(`/ijin/ajuan/${item.id}`).then(() => {
      loadAjuan();
    }).catch(err => toast.error(err.toString()));
  }, function() {
    // nothing to worry
  })
}

/**
 * BAGIAN LAPORAN
 */
async function downloadReport() {
  mainStore.showSpinner('MENGENERATE LAPORAN');
  await apiService.download('/absensi/harian', {
    institution: idSekolah.value,
    start: format(reportDate.value[0], 'dd/MM/yyyy'),
    end: format(reportDate.value[1], 'dd/MM/yyyy'),
    excel: 3
  });
  mainStore.hideSpinner();
}

/**
 * Watcher untuk sinkronisasi data
 * NOTE: watcher hanya akan ke trigger jika idSekolah.value berubah karena aplikasi di run pertamakali
 * asumsi aplikasi dirun setiap hari
 */
watch(idSekolah, async () => {
  if (! idSekolah.value) {
    return;
  }

  try {
    // 1.1.13 load shift data saat pertamakali di load
    const data = await apiService.getResource('/api/shift', { sekolah: idSekolah.value });
    if (! data.libur) {
      Object.assign(shiftData, data);
    }
    // 1.1.12 ubah sinkronDate dengan tanggal dari server
    const dateTime = shiftData.tanggal.split(' ');
    sinkronDate.value = dateTime[0];
    // cek selisih jam server dengan jam komputer
    const d = dateTime[0].split('/').reverse().join('-') + ' ' + dateTime[1];
    const now = parseFloat(format(new Date(), 't'));
    const nowServer = parseFloat(format(new Date(d), 't'));
    if (Math.abs(now - nowServer) > (5 * 60)) {
      toast.error('Jam komputer selisih > 5 menit dibandingkan dengan jam server, silahkan sinkron manual');
    }
    // 1.2.0 load pengajuan ijin
    loadAjuan();
  } catch(_e) {
    toast.error('Gagal menghubungi server dikarenakan jaringan');
    inIdling.value = true;
  }
}, { immediate: true });

/**
 * Watcher untuk sinkronisasi data
 */
watch(sdkActiveAndShiftCalled, (val) => {
  if (val) {
    checkAsyncActive();
  }
}, { immediate: true });

/**
 * On mounted
 */
onMounted(() => {
  // initialize sdk
  sdk.value = Sdk.getInstance();
  const sdkSetting = localStorage.getItem('sdkSetting');
  if (sdkSetting) {
    sdkConfig.value = JSON.parse(sdkSetting);
  }

  loadSyncData();
  loadPegawai();
});
</script>

<template>
  <div class="pt-3">
    <Header :sekolah="sekolah" @db-active="dbActive = true" @sdk-active="sdkActive = true"></Header>

    <div class="row mt-4">
      <div class="col-10 offset-1">
        <div class="row">
          <div class="col d-flex justify-content-start">
            <div class="d-flex flex-column align-items-center main-icon-menu" v-on:click="changeMenu('sinkron')" :class="{ 'inactive': activeMenu != 'sinkron' }">
              <div class="icon-container">
                <img src="/img/001-syncronization.png" class="" alt="absensi">
              </div>
              <p class="mt-1 font-weight-bold icon-label">SINKRON ABSENSI</p>
            </div>
          </div>
          <div class="col d-flex justify-content-center">
            <div class="d-flex flex-column align-items-center main-icon-menu" v-on:click="changeMenu('employee')" :class="{ 'inactive': activeMenu != 'employee' }">
              <div class="icon-container">
                <img src="/img/001-business.png" alt="pegawai">
              </div>
              <p class="mt-1 font-weight-bold icon-label">DATA PEGAWAI</p>
            </div>
          </div>
          <div class="col d-flex justify-content-end">
            <div class="d-flex flex-column align-items-center main-icon-menu" v-on:click="changeMenu('permit')" :class="{ 'inactive': activeMenu != 'permit' }">
              <div class="icon-container">
                <img src="/img/001-permission.png" alt="laporan">
              </div>
              <p class="mt-1 font-weight-bold icon-label">PENGAJUAN IJIN</p>
            </div>
          </div>
          <div class="col d-flex justify-content-end">
            <div class="d-flex flex-column align-items-center main-icon-menu" v-on:click="changeMenu('report')" :class="{ 'inactive': activeMenu != 'report' }">
              <div class="icon-container">
                <img src="/img/002-seo-report.png" alt="laporan">
              </div>
              <p class="mt-1 font-weight-bold icon-label">LIHAT LAPORAN</p>
            </div>
          </div>
        </div>

        <!-- MENU SINKRON ABSENSI -->
        <div class="row mt-3" v-if="activeMenu == 'sinkron'">
          <div class="col card-container">
            <div class="card shadow-sm">
              <div class="card-body">
                <div class="row">
                  <div class="col-8 offset-2">
                    <div class="row mb-2">
                      <div class="col">
                        <p class="last-sync-info mb-0 mt-2">Terakhir Sinkron: {{ lastSync }}</p>
                      </div>
                      <div class="col text-right">
                        <button class="btn btn-sm btn-dark view-sync-history" data-toggle="modal" data-target="#sync-modal" :disabled="syncList.length == 0" type="button">
                          <i class="icon-folder-alt"></i> Lihat Histori Sinkronisasi
                        </button>
                      </div>
                    </div>
                    
                    <div class="text-center mb-3">
                      <p class="alert alert-success mb-3 p-1" v-if="shiftData.shift.scanIn.length > 0" style="line-height: 1rem;">
                        <small>Jadwal sinkron absensi untuk hari ini adalah: <br>
                          <strong>{{ shiftData.shift.scanIn.replace(/:00$/, '') }} - {{ shiftData.shift.scanInEnd.replace(/:00$/, '') }}</strong>
                        
                          <br><strong>{{ shiftData.shift.scanOut.replace(/:00$/, '') }} - {{ shiftData.shift.scanOutEnd.replace(/:00$/, '') }}</strong><br>Diluar jam tersebut tidak akan diproses oleh server
                        </small>
                      </p>
                      <p class="alert alert-warning mb-3 p-3" v-else style="font-size: 1.2rem;">L I B U R</p>
                      <!-- <date-picker :format="'DD/MM/YYYY'" v-model="sinkronDate" :value-type="'DD/MM/YYYY'" :disabled-date="disabledBefore1March"></date-picker> -->
                    </div>
                    <p class="mb-1" v-if="shiftData.shift.scanIn.length > 0">
                      <button type="button" class="btn btn-lg btn-block btn-primary py-3 shadow" :disabled="inIdling" v-on:click="syncronize()">Sinkron Absensi Sekarang</button>
                    </p>
                    <p class="text-center mb-3">
                      <button class="btn btn-link btn-sm" type="button" data-toggle="modal" data-target="#async-modal"><small><strong>AKTIFKAN AUTO SINKRON</strong></small></button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MENU DATA PEGAWAI -->
        <div class="row mt-2" v-if="activeMenu == 'employee'">
          <div class="col px-0">
            <div class="row mb-2">
              <div class="col px-0">
                <p class="m-0 p-1" style="line-height: 0.6em;">
                  <small><em>Setiap ada perubahan data pegawai di mesin, pastikan lakukan proses download pegawai. Pastikan sebelum sinkron absensi ke server, data pegawai sudah terdownload. Hanya pegawai yang tercontreng/centang saja yang akan disinkron ke server</em></small>
                </p>
              </div>
              <div class="col px-0">
                <div class="text-right">
                  <button class="btn btn-success" type="button" v-on:click="syncronPegawai()">DOWNLOAD/SINKRON PEGAWAI</button>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col card-container">
                <div class="card shadow-sm">
                  <div class="card-body p-0" style="overflow-x:hidden; overflow-y:auto">
                    <div class="row">
                      <div class="col">
                        <table class="table mb-0">
                          <thead class="thead-dark">
                            <tr>
                              <th title="pegawai ikut disinkronkan"><i class="icon-list"></i></th>
                              <th>NIP</th>
                              <th>NAMA</th>
                              <th>ALIAS</th>
                            </tr>
                          </thead>
                          <tbody v-if="pegawaiList.length == 0">
                            <tr>
                              <td colspan="4">
                                <h5 class="text-center">TIDAK ADA DATA</h5>
                              </td>
                            </tr>
                          </tbody>
                          <tbody v-else>
                            <tr v-for="(pegawai, i) in pegawaiList" :key="pegawai.id">
                              <td>
                                <div class="custom-control custom-checkbox">
                                  <input type="checkbox" class="custom-control-input" v-model="pegawai.active" @change="updateStatusActive(i)" :id="`check-${pegawai.id}`">
                                  <label class="custom-control-label" :for="`check-${pegawai.id}`"></label>
                                </div>
                              </td>
                              <td>{{pegawai.nip}}</td>
                              <td>{{pegawai.nama}}</td>
                              <td>{{pegawai.namaSingkat}}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MENU PENGAJUAN IJIN -->
        <div class="row mt-3" v-if="activeMenu == 'permit'">
          <div class="col card-container">
            <div class="row mb-2 no-gutters">
              <div class="col text-right">
                <button type="button" shadow-sm class="btn btn-primary" data-toggle="modal" data-target="#ijin-modal"><i class="icon-plus mr-1"></i> TAMBAH AJUAN</button>
              </div>
            </div>
            <div class="card shadow-sm">
              <div class="card-body p-0" style="overflow-x:hidden; overflow-y:auto">
                <div class="row">
                  <div class="col">
                    <table class="table table-sm mb-0">
                      <thead class="thead-dark">
                        <tr>
                          <th rowspan="2" class="align-top">NIP / NAMA</th>
                          <th rowspan="2" class="align-top">JENIS IJIN</th>
                          <th colspan="2" class="text-center">TANGGAL</th>
                          <th rowspan="2" class="align-top">STATUS</th>
                          <th rowspan="2"></th>
                        </tr>
                        <tr>
                          <th>MULAI</th>
                          <th>SELESAI</th>
                        </tr>
                      </thead>
                      <tbody v-if="ajuanList.length == 0">
                        <tr>
                          <td colspan="8">
                            <h5 class="text-center">TIDAK ADA DATA</h5>
                          </td>
                        </tr>
                      </tbody>
                      <tbody v-else>
                        <tr v-for="(v, i) in ajuanList" :key="v.id">
                          <td><span class="text-muted">{{v.nip}}</span><br>{{v.nama}}</td>
                          <td>{{ jenisIjinList.find(k => k.id == v.jenis)?.val }}<br><span class="text-muted">{{v.alasan}}</span></td>
                          <td class="align-middle">{{v.mulai.split('-').reverse().join('/')}}</td>
                          <td class="align-middle">{{v.akhir.split('-').reverse().join('/')}}</td>
                          <td class="align-middle">
                            <span class="text-muted font-weight-bold" v-if="v.status == 1"><i class="icon-clock"></i> DIAJUKAN</span>
                            <span class="text-success font-weight-bold" v-if="v.status == 2"><i class="icon-check"></i> DISETUJUI</span>
                            <span class="text-danger font-weight-bold" v-if="v.status == 3"><i class="icon-close"></i> DITOLAK</span>
                          </td>
                          <td class="align-middle">
                            <button type="button" @click="editAjuan(i)" data-toggle="modal" data-target="#ijin-modal" v-if="v.status == 1" class="btn btn-sm btn-info"><i class="icon-pencil"></i></button>
                            <button type="button" @click="deleteAjuan(i)" v-if="v.status != 2" class="btn btn-sm btn-danger"><i class="icon-trash"></i></button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MENU LAPORAN -->
        <div class="row mt-3" v-if="activeMenu == 'report'">
          <div class="col card-container">
            <div class="card shadow-sm">
              <div class="card-body">
                <form role="form">
                  <div class="row mt-4 form-group">
                    <label for="date-start" class="col-3 offset-1 col-form-label">Tanggal Absensi</label>
                    <div class="col-7">
                      <VueDatePicker v-model="reportDate" :teleport="true" teleport-center :enable-time-picker="false" range format="dd/MM/yyyy" select-text="Pilih" cancel-text="Batal"></VueDatePicker>
                      <!-- <date-picker :format="'DD/MM/YYYY'" v-model="reportDate" :value-type="'DD/MM/YYYY'" range></date-picker> -->
                    </div>
                  </div>
                  <div class="row mt-2 mb-4 form-group">
                    <div class="col-6 offset-3">
                      <button type="button" class="btn btn-primary btn-lg btn-block shadow-sm py-2" v-on:click="downloadReport()">Buat Laporan &amp; Unduh</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <FpModal @syncron-pegawai="syncronPegawai()"></FpModal>

  <!-- MODAL MENAMPILKAN HISTORI SINKRON -->
  <div class="modal fade" id="sync-modal" data-backdrop="static" data-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Histori Sinkronisasi</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body" style="overflow: auto">
          <table class="table">
            <thead class="thead-dark">
              <tr>
                <th>Waktu Sinkron</th>
                <th>Data Terproses</th>
              </tr>
            </thead>
            <tbody>
              <tr :key="i" v-for="(d, i) in syncList">
                <td>{{d.date.split(' ')[0].split('-').reverse().join('-')}} {{d.date.split(' ')[1]}}</td>
                <td>{{d.count}}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Tutup</button>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL MENAMPILKAN INPUT AKTIVASI AUTO SINKRON -->
  <div class="modal fade" id="async-modal" data-backdrop="static" data-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Aktivasi Autosinkron</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <form role="form" name="formAsync">
            <p class="alert alert-info shadow-sm p-1 text-justify" style="line-height: 1rem;">Fitur Autosinkron adalah fitur dimana aplikasi akan melakukan sinkron absensi secara otomatis pada menit tertentu setiap jam sesuai shift masuk sekolah. <strong>Pastikan SDK sudah diaktifkan dan ada kode aktivasi yang masih berlaku.</strong><br><br>
              <small><em>* Aktivasi SDK dan kode aktivasi dapat ditanyakan pada koordinator wilayah kecamatan masing-masing</em></small>
            </p>
            <div class="form-group">
              <input type="text" name="asyncode" id="asyncode" class="form-control" v-model="async.number" minlength="4" maxlength="100" required placeholder="Kode Aktivasi" :disabled="isAsyncActive">
            </div>
            <p class="text-muted" v-if="isAsyncActive">BERLAKU S/D: {{ async.expired }}</p>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal / Tutup</button>
          <button type="button" data-dismiss="modal" class="btn btn-primary shadow-sm" v-on:click="saveAsyncNumber()" v-if="! async.expired">Aktifkan Fitur</button>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL UNTUK MENAMPILKAN FORM PENGAJUAN IJIN -->
  <IjinModal :ajuan-list="ajuanList" :pegawai-list="pegawaiList" :id-edited="idEdited" :id-sekolah="idSekolah" :jenis-ijin-list="jenisIjinList" @updated="loadAjuan()"></IjinModal>
  
</template>

<style lang="scss" scoped>
.main-icon-menu {
  &.inactive {
    .icon-container {
      border: 2px solid rgba($color: #000000, $alpha: .1);
      cursor: pointer;
    }
    img {
      filter: grayscale(100%);
      &:hover {
        filter: grayscale(0%);
      }
    }
  }
  .icon-container {
    width: 60px;
    height: 60px;
    border: 2px solid rgba($color: #000000, $alpha: 0.6);
    border-radius: 50%;
    padding: 10px;
    img {
      width: 100%;
      transition: .5s;
    }
  }
}
.icon-label {
  font-size: .8rem;
}

p.last-sync-info, button.view-sync-history {
  font-size: 11px;
}

.btn-lg.btn-block {
  font-size: 1rem;
  text-transform: uppercase;
}

.card-container {
  overflow-y: auto;
  max-height: 305px;
  padding-left: 0 !important;
  padding-right: 0 !important;
}
</style>