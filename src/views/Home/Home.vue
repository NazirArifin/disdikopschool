<template src="@/views/Home/Home.html"></template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unreachable */
import { Component, Vue, Watch } from 'vue-property-decorator'
import Header from '@/components/Header.vue'
const DatePicker = require('vue2-datepicker').default
import 'vue2-datepicker/locale/id'
import { SyncType, MyDb, PegawaiType } from '@/services/mydb'
const alertify = require('alertifyjs');
import { ValidationProvider, ValidationObserver, extend } from 'vee-validate'
import { required, min, max } from 'vee-validate/dist/rules'
import { initJsStore, conn } from '@/services/idb'
import moment from 'moment'
import Api from '@/helpers/api'
import { ConfigType, FbDb } from '@/services/fpdb'
import { Sdk, SdkConfigType } from '@/services/sdk'
import { ipcRenderer } from 'electron'
declare const $: any;
import schedule from 'node-schedule'

extend('required', required);
extend('min', min);
extend('max', max);

@Component({
  components: {
    Header, DatePicker,
    ValidationProvider, ValidationObserver
  },
  directives: {
    pickFile: {
      inserted: (el: HTMLElement, binding: any, vnode: any) => {
        const $el = $(el);
        $el.on('change', (e: Event) => {
          const count = $el[0].files.length;
          if (count === 0) return;
          const file: File = $el[0].files[0];
          if (file.size > 1 * 1024 * 1024) {
            vnode.context.$toast.error('ERROR: File tidak boleh lebih besar dari 1MB');
          }
          vnode.context.file = file;
        });
      }
    }
  }
})
export default class Home extends Vue {
  private activeMenu = 'sinkron';
  private reportDate = '';
  private sinkronDate = '';
  private empDb: MyDb;
  private syncDb: MyDb;
  private apiService: Api = new Api();
  private dbActive = false;
  private sdkActive = false;

  // get anyDbSdkActive() {
  //   // return this.dbActive || this.sdkActive;
  //   if (this.sdkActive) {
  //     return true;
  //   }
  //   if (this.dbActive) {
  //     return true;
  //   }
  //   return false;
  // }
  get sekolah() {
    return this.$store.state.user.sekolah.nama;
  }
  get idSekolah() {
    return this.$store.state.user.sekolah.id;
  }
  get lastSync() {
    if (this.syncList.length == 0) {
      return '-';
    }
    return moment(this.syncList[0].date).format('dddd, DD MMMM YYYY HH.mm');
  }
  get fileLabel() {
    if (this.file == null) {
      if (this.ajuan.id == 0) return 'Pilih Dokumen';
      else return 'Ganti Dokumen';
    }
    return this.file.name;
  }

  disabledBefore1March(date: Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today || date < new Date(2021, 1, 28, 0, 0, 1);
  }

  changeMenu(menu: string) {
    this.activeMenu = menu;
  }

  private activeSetting = 'sdk';
  setActiveSetting(type: string) {
    if (type != this.activeSetting) {
      this.activeSetting = type;
    }
  }

  /* BAGIAN DATABASE CONNECTION */
  private dbConfig: ConfigType = {
    host: 'localhost', port: '3306', user: 'root', 
    password: '', database: '', multipleStatements: true,
    connectionLimit: 3000
  }
  private fbDb: FbDb;
  async saveSetting() {
    await this.empDb.clear();
    if (this.activeSetting == 'db') {
      this.fbDb.changeSetting(this.dbConfig);
    } else {
      try {
        await this.sdk.changeSetting(this.sdkConfig);
      } catch(err) {
        this.$toast.error(err.toString());
      }
    }
    this.syncronPegawai();
  }
  private checkingConn = false;
  async checkDbConn() {
    this.checkingConn = true;
    if (this.activeSetting == 'db') {
      this.fbDb.checkConnection(this.dbConfig).then(data => {
        alertify.alert('KONEKSI SUKSES', `<strong class="text-success">Versi MySQL: ${data.version}</strong><br>&bull; Tabel absensi <i class="icon-${data.tabelAbsensi != -1 ? 'check' : 'close'}"></i><br>&bull; Tabel pegawai <i class="icon-${data.tabelPegawai != -1 ? 'check' : 'close'}"></i>`, function() {
          // do nothing
        });
        this.checkingConn = false;
      }).catch(err => {
        this.checkingConn = false;
        alertify.alert('ERROR', '<strong class="text-danger">KONEKSI GAGAL</strong>', function() {
          // do nothing
        });
      });
    } else {
      this.sdk.quickCheckConnection().then(data => {
        alertify.alert('KONEKSI SUKSES', `<strong class="text-success">Jam Mesin: ${data.DEVINFO.Jam}</strong><br>&bull; Jumlah User: ${data.DEVINFO.User}<br>&bull; Jumlah Absensi: ${data.DEVINFO['All Presensi']}`, function() {
          // do nothing
        });
        this.checkingConn = false;
      }).catch(err => {
        this.checkingConn = false;
        alertify.alert('ERROR', '<strong class="text-danger">KONEKSI GAGAL</strong>', function() {
          // do nothing
        });
      });  
    }
  }

  /* BAGIAN SDK SETTING */
  private sdkConfig: SdkConfigType = {
    instpath: '', ipmac: '', portmac: '5005', snmac: '', 
    passwordmac: '0', numbermac: '1', activationmac: '',
    iphost: '', porthost: ''
  }
  private sdk: Sdk;
  constructor() {
    super();
    this.empDb = new MyDb(initJsStore, conn, 'Pegawai');
    this.syncDb = new MyDb(initJsStore, conn, 'Sinkron');
    // initialize db conn and set config to storage
    this.fbDb = FbDb.getInstance();
    const dbSetting = localStorage.getItem('dbSetting');
    if (dbSetting) {
      this.dbConfig = JSON.parse(dbSetting);
    }
    // initialize sdk
    this.sdk = Sdk.getInstance();
    const sdkSetting = localStorage.getItem('sdkSetting');
    if (sdkSetting) {
      this.sdkConfig = JSON.parse(sdkSetting); 
    }
  }

  // BAGIAN SYNCRON
  // ----------------------------------------------------------------------------------
  private syncList: readonly SyncType[] = [];
  async loadSyncData() {
    this.syncList = Object.freeze(await this.syncDb.getAll(365));
  }

  private inIdling = false;
  activateIdling() {
    this.inIdling = true;
    setTimeout(() => {
      this.inIdling = false;
    }, 5 * 60 * 1000);
  }

  private userList: readonly { pin: string; name: string }[] = [];
  private logList: readonly { pin: string; dateTime: string }[] = [];
  
  // 1.1.8 rewrite syncronize, harapannya lebih mudah dibaca dan lebih mudah di debug
  async syncronize() {

    const today = this.sinkronDate.split('/').reverse().join('-');
    let logs: { pin: string; name: string; alias: string; dateTime: string }[] = [];
    try {
      this.$store.dispatch('showSpinner', 'MENGAMBIL ABSENSI');
      
      // prioritas pengambilan data log
      let tempLogs: any[] = [];
      let useSdk = false;
      if (this.sdkActive && this.isAsyncActive) {
        tempLogs = await this.sdk.getScanLog(today);
        useSdk = true;
      } else {
        tempLogs = await this.fbDb.getScanLog(today);
      }

      // variabel logs berisi templog yang raw di filter dan di map
      logs = tempLogs.filter((v: any) => {
        const p = this.pegawaiList.find((k: PegawaiType) => k.pin == v.pin);
        return p?.active;
      }).map((v: any) => {
        const p = this.pegawaiList.find((k: PegawaiType) => k.pin == v.pin);
        return {
          pin: p?.nip || '', name: p?.nama || '', alias: p?.namaSingkat || '', 
          dateTime: moment((v.scan_date + '').replace(/\./g, ':')).format('YYYY-MM-DD HH:mm:ss')
        };
      });

      if (useSdk) {
        // 1.1.8 tulis ke file untuk di append hanya jika yang pakai sdk, jika pakai database tidak perlu
        // karena di database selalu ada data untuk hari ini
        // const data = await ipcRenderer.invoke('write-log', '2021-09-11', [ { 'scan_date': '2021-08-11 10.00.00', pin: '1212202' } ]);
        logs = await ipcRenderer.invoke('write-log', today, logs);
      }
      // jika tidak ada data baru yang dapat dikirimkan ke server maka kita throw
      if (logs.length == 0) {
        throw new Error('');
      }

      this.$store.dispatch('changeSpinnerMessage', 'MENGIRIM DATA KE SERVER');
      const data = await this.apiService.postResource('/sinkron', {
        pin: JSON.stringify(logs.map(v => v.pin)),
        name: JSON.stringify(logs.map(v => v.name)),
        alias: JSON.stringify(logs.map(v => v.alias)),
        dateTime: JSON.stringify(logs.map(v => v.dateTime))
      });
      this.$store.dispatch('hideSpinner');
      if (data.success) {
        this.$toast.success(`SUKSES: JUMLAH DATA TERPROSES: ${data.count}`);
        this.activateIdling();
        await this.syncDb.insert({ date: moment().local().format('YYYY-MM-DD HH:mm:ss'), count: data.count });
        this.loadSyncData();
      }
    } catch(err) {
      // pastikan 
      this.$store.dispatch('hideSpinner');
      // 1.1.8 extract object jika bukan string
      if (typeof(err) != 'string') {
        const message = err.toString();
        if (message == 'Object') {
          // extract
          const temp: string[] = [];
          for (const key in err) {
            if (Object.prototype.hasOwnProperty.call(err, key)) {
              temp.push(`${key}: ${err[key]}`);
            }
          }
          this.$toast.error(temp.join(', '));
        } else {
          if (message.length > 0) {
            this.$toast.error(message);
          }
        }
      } else {
        if (err.length > 0) {
          this.$toast.error(err);
        }
      }
    }

  }
  

  // BAGIAN DATA PEGAWAI
  // ----------------------------------------------------------------------------------
  
  private pegawaiList: PegawaiType[] = [];
  async syncronPegawai() {
    this.pegawaiList = [];
    try {
      // ambil data dari database atau dari sdk, diutamakan yang sdk
      let empDb: any[] = [];
      if (this.sdkActive && this.isAsyncActive) {
        const rows = await this.sdk.getPegawai();
        empDb = rows.Data.map((v: any) => {
          return {
            pin: v.PIN, nip: v.PIN, nama: v.Name, alias: v.Name
          };
        });
      } else {
        const rows = await this.fbDb.getPegawai();
        empDb = rows.map((v: any) => {
          return { pin: v.pegawai_pin, nip: v.pegawai_nip || v.pegawai_pin, nama: v.pegawai_nama, alias: v.pegawai_alias };
        });
      }

      let empIdb: PegawaiType[] = await this.empDb.getAll();
      let change = false;
      if (empDb.length > empIdb.length) {
        for await (const v of empDb) {
          if (empIdb.findIndex((k: any) => k.nip == v.nip) == -1) {
            this.empDb.insert({
              pin: v.pin, nip: v.nip, nama:v.nama, namaSingkat: v.alias, active: true
            });
          }
        }
        change = true;
      }
      if (empIdb.length > empDb.length) {
        for await (const v of empIdb) {
          if (empDb.findIndex((k: any) => k.nip == v.nip) == -1) {
            await this.empDb.delete({ id: v.id });
          }
        }
        change = true;
      }

      if (change) empIdb = await this.empDb.getAll();
      // apakah ada perubahan
      for await (const v of empIdb) {
        const i = empDb.findIndex((k: any) => k.nip == v.nip);
        if (i != -1) {
          const p = empDb[i];
          const o = {};
          if (p.nip != v.nip) Object.assign(o, { nip: p.nip });
          if (p.nama != v.nama) Object.assign(o, { nama: p.nama });
          if (p.alias != v.namaSingkat) Object.assign(o, { namaSingkat: p.alias });
          if (Object.keys(o).length > 0) {
            change = true;
            await this.empDb.update(o, { id: v.id });
          }
        }
      }
      if (change) empIdb = await this.empDb.getAll();
      this.pegawaiList = empIdb;

    } catch(err) {
      this.$toast.error(err.toString());
    }
  }

  async loadPegawai() {
    this.pegawaiList = await this.empDb.getAll();
  }

  updateStatusActive(i: number) {
    const p = this.pegawaiList[i];
    this.empDb.update({ active: p.active }, { id: p.id });
  }

  // BAGIAN PENGAJUAN IJIN
  // ----------------------------------------------------------------------------------
  private ajuan: { id: number; sekolah: string; pegawai: string; jenis: string; alasan: string; keterangan: string; tanggal: string[]|string } = this.presetAjuan();
  private file: File|null = null;
  presetAjuan() {
    return {
      id: 0, sekolah: '', pegawai: '', jenis: '', alasan: '', keterangan: '', tanggal: ['', '']
    };
  }
  resetAjuan() {
    this.ajuan = this.presetAjuan();
    this.file = null;
  }

  private jenisIjinList: { id: number; val: string }[] = [
    { id: 1, val: 'Tidak Masuk' },
    { id: 2, val: 'Datang Terlambat' },
    { id: 3, val: 'Pulang Awal' },
    { id: 4, val: 'Tidak Scan Masuk' },
    { id: 5, val: 'Tidak Scan Pulang' },
  ];
  private ajuanList: any[] = [];
  loadAjuan() {
    this.apiService.getResource('/ijin', { sekolah: this.idSekolah }).then(data => {
      this.ajuanList = data;
    }).catch(err => this.$toast.error(err.toString()));
  }
  editAjuan(i: number) {
    const item = this.ajuanList[i];
    this.ajuan.id = item.id;
    this.ajuan.pegawai = item.nip;
    this.ajuan.jenis = item.jenis;

    const f = this.jenisIjinList.find((v: any) => v.id == item.alasan);
    if (f) {
      this.ajuan.alasan = '' + f.id;
    } else {
      this.ajuan.alasan = '5';
    }
    this.ajuan.keterangan = item.alasan;
    
    this.ajuan.tanggal = [item.mulai.split('-').reverse().join('/'), item.akhir.split('-').reverse().join('/')];
  }
  deleteAjuan(i: number) {
    alertify.confirm('Hapus Ajuan', 'Apakah Anda yakin akan data ajuan ijin ini?', async () => {
      const item = this.ajuanList[i];
      this.apiService.deleteResource(`/ijin/ajuan/${item.id}`).then(() => {
        this.loadAjuan();
      }).catch(err => this.$toast.error(err.toString()));
    }, function() {
      // nothing to worry
    })
  }

  saveIjin() {
    this.$store.dispatch('showSpinner', 'MENGIRIM DATA');
    this.ajuan.sekolah = this.idSekolah;
    if (Array.isArray(this.ajuan.tanggal)) {
      this.ajuan.tanggal = this.ajuan.tanggal.join(',');
    }
    this.apiService.postResource('/ijin/ajuan', this.ajuan, true, this.file).then(() => {
      this.$store.dispatch('hideSpinner');
      this.$toast.success('Data ajuan berhasil disimpan');
      this.resetAjuan();
      this.loadAjuan();
    }).catch(err => {
      this.$toast.error(err.toString());
      this.$store.dispatch('hideSpinner');
    });
  }

  // BAGIAN LAPORAN
  // ----------------------------------------------------------------------------------
  downloadReport() {
    this.$store.dispatch('showSpinner', 'MEN-GENERATE LAPORAN');
    this.apiService.download('/absensi/harian', {
      institution: this.idSekolah,
      start: this.reportDate[0],
      end: this.reportDate[1],
      excel: 3
    }).then(() => {
      // this.isDownloading = false;
      this.$store.dispatch('hideSpinner');
    }).catch(() => {
      // this.isDownloading = false;
    });
  }

  // BAGIAN AUTOSINKRON
  // ----------------------------------------------------------------------------------
  private isAsyncActive = false;
  private async: { number: string; expired: string } = { number: '', expired: '' };
  randomIntFromInterval(min: number, max: number): number {
    if (min > max) {
      const t = min;
      min = max;
      max = t;
    }
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  // mengecek apakah sn autosync aktif
  async checkAsycActive() {
    const sn = localStorage.getItem('asyncKey');
    if (sn) {
      const { number, expired } = JSON.parse(sn);
      const now = moment().local().unix();
      this.isAsyncActive = true;
      if (now > expired) {
        localStorage.removeItem('asyncKey');
        this.isAsyncActive = await this.saveAsyncNumber();
      }
      
      // hanya jika autosync aktif kita set beberapa jam untuk sinkron
      if (this.isAsyncActive) {
        this.async = {
          number: number, 
          expired: moment.unix(expired).utc().local().format('DD-MM-YYYY HH.mm')
        };
        
        const shift: { libur: boolean; shift: { scanIn: string; scanOut: string } } = await this.apiService.getResource('/api/shift', { sekolah: this.idSekolah });
        if ( ! shift.libur) {
          const { scanIn, scanOut } = shift.shift;
          const dayOfWeek = [1, 2, 3, 4, 5, 6];

          // TODO: tes ujicoba
          // const ruleInHours = [10, 11];
          // const ruleInMinute = [8, 9, 10, 11, 12, 13, 14, 15, 16];
          // const ruleIn = new schedule.RecurrenceRule();
          // ruleIn.dayOfWeek = dayOfWeek;
          // ruleIn.hour = ruleInHours;
          // ruleIn.minute = ruleInMinute;
          // const j1 = schedule.scheduleJob(ruleIn, () => {
          //   console.log('called');
          // });
          
          // untuk scan masuk
          let split = scanIn.split(':');
          let hour = parseInt(split[0]);
          const ruleInHours = [hour, hour + 1, hour + 2];
          let minute = this.randomIntFromInterval(0, 30);
          const ruleInMinute = [minute, minute + 30];
          const ruleIn = new schedule.RecurrenceRule();
          ruleIn.dayOfWeek = dayOfWeek;
          ruleIn.hour = ruleInHours;
          ruleIn.minute = ruleInMinute;
          const j1 = schedule.scheduleJob(ruleIn, () => {
            this.syncronize();
          });

          // untuk scan pulang, jenjang korwil pulang ada yang 10:30
          split = scanOut.split(':');
          hour = parseInt(split[0]);
          const ruleOutHours = [hour, hour + 1, hour + 2];
          minute = this.randomIntFromInterval(parseInt(split[1]), parseInt(split[1]) + 30);
          const ruleOutMinute = [minute, Math.abs((minute + 30) - 60)];
          const ruleOut = new schedule.RecurrenceRule();
          ruleOut.dayOfWeek = dayOfWeek;
          ruleOut.hour = ruleOutHours;
          ruleOut.minute = ruleOutMinute;
          const j2 = schedule.scheduleJob(ruleOut, () => {
            this.syncronize();
          });
        }
      }
      
      // 1.1.6 autosync waktu start pertama
      this.syncronize();
    }
  }

  // try ask server apakah ada sn yang aktif
  saveAsyncNumber(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiService.checkSn({ sn: this.async.number, sekolah: this.idSekolah }).then(data => {
        if ( ! data.valid) {
          this.$toast.error('Kode Aktifasi Tidak Valid!');
          reject(false);
        } else {
          localStorage.removeItem('asyncKey');
          localStorage.setItem('asyncKey', JSON.stringify({
            number: this.async.number,
            expired: data.until
          }));
          this.isAsyncActive = true;
          this.async.expired = moment.unix(data.until).utc().local().format('DD-MM-YYYY HH.mm');
          this.$toast.success('Aktivasi Sukses!');
          resolve(true);
        }
      }).catch(err => {
        this.$toast.error(err.toString());
        reject(false);
      });
    });
  }

  mounted() {
    this.loadSyncData();
    this.loadAjuan();
    this.sinkronDate = moment().format('DD/MM/YYYY');
    this.loadPegawai();

    // TODO: TESTING PURPOSES ONLY
    // const data = await ipcRenderer.invoke('write-log', '2021-08-13', [{ pin: '232', dateTimes: '2021-08-13 06.00.00' }]);
    // console.log(data);
  }

  @Watch('sdkActive', { immediate: true }) onSdkActive(val: boolean) {
    if (val) {
      this.checkAsycActive();
    }
  }
  @Watch('dbActive', { immediate: true }) onDbActive(val: boolean) {
    if (val && ! this.sdkActive) {
      this.syncronize();
    }
  }

}
</script>

<style lang="scss" scoped src="@/views/Home/Home.scss">