<template>
  <div class="pt-3">
    <Header :sekolah="sekolah"></Header>

    <div class="row mt-4">
      <div class="col-10 offset-1">
        <div class="row">
          <div class="col d-flex justify-content-start">
            <div class="d-flex flex-column align-items-center main-icon-menu" v-on:click="changeMenu('sinkron')" :class="{ 'inactive': activeMenu != 'sinkron' }">
              <div class="icon-container p-3">
                <img src="/img/001-syncronization.png" class="" alt="absensi">
              </div>
              <p class="mt-1 font-weight-bold icon-label">SINKRON ABSENSI</p>
            </div>
          </div>
          <div class="col d-flex justify-content-center">
            <div class="d-flex flex-column align-items-center main-icon-menu" v-on:click="changeMenu('employee')" :class="{ 'inactive': activeMenu != 'employee' }">
              <div class="icon-container p-3">
                <img src="/img/001-business.png" alt="pegawai">
              </div>
              <p class="mt-1 font-weight-bold icon-label">DATA PEGAWAI</p>
            </div>
          </div>
          <div class="col d-flex justify-content-end">
            <div class="d-flex flex-column align-items-center main-icon-menu" v-on:click="changeMenu('report')" :class="{ 'inactive': activeMenu != 'report' }">
              <div class="icon-container p-3">
                <img src="/img/002-seo-report.png" alt="laporan">
              </div>
              <p class="mt-1 font-weight-bold icon-label">LIHAT LAPORAN</p>
            </div>
          </div>
        </div>

        <!-- MENU SINKRON -->
        <div class="row mt-3" v-if="activeMenu == 'sinkron'">
          <div class="col card-container">
            <div class="card shadow-sm">
              <div class="card-body">
                <div class="row">
                  <div class="col-8 offset-2">
                    <div class="row mb-2">
                      <div class="col">
                        <p class="last-sync-info mb-0 mt-2">Terakhir Sinkron: {{lastSync}}</p>
                      </div>
                      <div class="col text-right">
                        <button class="btn btn-sm btn-dark view-sync-history" data-toggle="modal" data-target="#sync-modal" :disabled="syncList.length == 0" type="button">
                          <i class="icon-folder-alt"></i> Lihat Histori Sinkronisasi
                        </button>
                      </div>
                    </div>
                    
                    <!-- <p class="last-sync-info mb-2 mt-4">Terakhir Sinkron: {{lastSync}}</p> -->
                    <div class="text-center mb-3">
                      <p class="alert alert-success mb-3 p-1">
                        <small>Dalam beberapa hari kedepan, Anda dapat melakukan sinkron untuk tanggal-tanggal selain hari ini. Pastikan Anda melakukan sinkron pada tanggal-tanggal tersebut terutama tanggal yang belum pernah disinkron sebelumnya.</small> 
                      </p>
                      <date-picker :format="'DD/MM/YYYY'" v-model="sinkronDate" :value-type="'DD/MM/YYYY'" :disabled-date="disabledBefore1March"></date-picker>
                    </div>
                    <p class="mb-3">
                      <button type="button" class="btn btn-lg btn-block btn-primary py-3 shadow" :disabled="inIdling" v-on:click="syncronize()">Sinkron Absensi Sekarang</button>
                    </p>

                    <!-- <p class="mb-4">
                      <button class="btn btn-sm btn-dark view-sync-history" data-toggle="modal" data-target="#sync-modal" :disabled="syncList.length == 0" type="button">
                        <i class="icon-folder-alt"></i> Lihat Histori Sinkronisasi
                      </button>
                    </p> -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MENU DATA PEGAWAI -->
        <div class="row mt-3" v-if="activeMenu == 'employee'">
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

        <!-- MENU LAPORAN -->
        <div class="row mt-3" v-if="activeMenu == 'report'">
          <div class="col card-container">
            <div class="card shadow-sm">
              <div class="card-body">
                <form role="form">
                  <div class="row mt-4 form-group">
                    <label for="date-start" class="col-3 offset-1 col-form-label">Tanggal Absensi</label>
                    <div class="col-7">
                      <date-picker :format="'DD/MM/YYYY'" v-model="reportDate" :value-type="'DD/MM/YYYY'" range></date-picker>
                    </div>
                  </div>
                  <div class="row mt-2 mb-4 form-group">
                    <div class="col-6 offset-3">
                      <button type="button" class="btn btn-primary btn-lg btn-block shadow-sm py-2" :disabled="reportDate.length == 0" v-on:click="downloadReport()">Buat Laporan &amp; Unduh</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

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

    <!-- MODAL EDIT / TAMBAH PERANGKAT -->
    <div class="modal fade" id="fp-modal" data-backdrop="static" data-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
      <validation-observer ref="formFP" slim v-slot="{ invalid }">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Pengaturan Database</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <form role="form" name="formFP">
                <p class="alert alert-warning shadow-sm"><small>Pastikan database yang dimasukkan adalah yang digunakan oleh aplikasi Fingerspot Personel</small></p>
                <validation-provider slim name="host" rules="required|min:4|max:40">
                  <div class="form-group">
                    <label for="ip">HOST</label>
                    <input type="text" name="host" id="host" class="form-control" minlength="4" maxlength="40" required v-model="dbConfig.host" placeholder="Nama Host" :disabled="checkingConn">
                  </div>
                </validation-provider>
                <validation-provider slim name="port" rules="required|min:2|max:5">
                  <div class="form-group">
                    <label for="port">PORT</label>
                    <input type="text" name="port" id="port" class="form-control" minlength="2" maxlength="5" required v-model="dbConfig.port" placeholder="Port Database" :disabled="checkingConn">
                  </div>
                </validation-provider>
                <validation-provider slim name="database" rules="required|min:2|max:40">
                  <div class="form-group">
                    <label for="database">Nama Database</label>
                    <input type="text" name="database" id="database" class="form-control" minlength="2" maxlength="40" required v-model="dbConfig.database" placeholder="Nama Database" :disabled="checkingConn">
                  </div>
                </validation-provider>
                <validation-provider slim name="user" rules="required|min:2|max:40">
                  <div class="form-group">
                    <label for="user">User Database</label>
                    <input type="text" name="user" id="user" class="form-control" minlength="2" maxlength="40" required v-model="dbConfig.user" placeholder="User Database" :disabled="checkingConn">
                  </div>
                </validation-provider>
                <validation-provider slim name="password" rules="min:2|max:40">
                  <div class="form-group">
                    <label for="password">Password Database</label>
                    <input type="text" name="password" id="password" class="form-control" minlength="2" maxlength="40" v-model="dbConfig.password" placeholder="Password Database" :disabled="checkingConn">
                  </div>
                </validation-provider>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal" :disabled="checkingConn">Batal / Tutup</button>
              <button type="button" class="btn btn-warning" v-on:click="checkDbConn()" :disabled="checkingConn">
                <span v-if="checkingConn"><i class="icon-clock"></i> </span> Tes Koneksi
              </button>
              <button type="button" data-dismiss="modal" class="btn btn-primary shadow-sm" v-on:click="saveSetting()" :disabled="invalid || checkingConn">Simpan Pengaturan</button>
            </div>
          </div>
        </div>
      </validation-observer>
    </div>
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, Vue } from 'vue-property-decorator'
import Header from '@/components/Header.vue'
const DatePicker = require('vue2-datepicker').default
import 'vue2-datepicker/locale/id'
import { SyncType, MyDb, PegawaiType } from '@/services/mydb'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const alertify = require('alertifyjs');
import { ValidationProvider, ValidationObserver, extend } from 'vee-validate'
import { required, min, max } from 'vee-validate/dist/rules'
import { initJsStore, conn } from '@/services/idb'
import moment from 'moment'
import Api from '@/helpers/api'
import { ConfigType, Database } from '@/helpers/db'

extend('required', required);
extend('min', min);
extend('max', max);

@Component({
  components: {
    Header, DatePicker,
    ValidationProvider, ValidationObserver
  }
})
export default class Home extends Vue {
  private activeMenu = 'sinkron';
  private reportDate = '';
  private sinkronDate = '';
  private empDb: MyDb;
  private syncDb: MyDb;
  private apiService: Api = new Api();

  get sekolah() {
    return this.$store.state.user.sekolah.nama;
  }
  get lastSync() {
    if (this.syncList.length == 0) {
      return '-';
    }
    return moment(this.syncList[0].date).format('dddd, DD MMMM YYYY HH.mm');
  }
  disabledBefore1March(date: Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today || date < new Date(2021, 1, 28, 0, 0, 1);
  }

  private dbConfig: ConfigType;
  async saveSetting() {
    localStorage.removeItem('dbSetting');
    localStorage.setItem('dbSetting', JSON.stringify(this.dbConfig));
    
    await this.empDb.clear();
    Database.close();
    Database.init(this.dbConfig);
    
    this.loadPegawai();
  }

  private checkingConn = false;
  async checkDbConn() {
    this.checkingConn = true;
    try {
      Database.close();
      Database.init(this.dbConfig);

      const v = await Database.query(`SHOW VARIABLES LIKE "version"`);
      const version = v[0].Value;
      const t = await Database.query(`SHOW TABLES`);
      const tables = t.map((row: any) => {
        return row.Tables_in_fpdb;
      }).filter((row: any) => row == 'att_log' || row == 'pegawai');

      alertify.alert('KONEKSI SUKSES', `<strong class="text-success">Versi MySQL: ${version}</strong><br>&bull; Tabel absensi <i class="icon-${tables.indexOf('att_log') != -1 ? 'check' : 'close'}"></i><br>&bull; Tabel pegawai <i class="icon-${tables.indexOf('pegawai') != -1 ? 'check' : 'close'}"></i>`, function() {
        // do nothing
      });
      this.checkingConn = false;
    } catch(err) {
      this.checkingConn = false;
      alertify.alert('ERROR', '<strong class="text-danger">KONEKSI GAGAL</strong>', function() {
        // do nothing
      });
    }
  }

  changeMenu(menu: string) {
    this.activeMenu = menu;
  }

  constructor() {
    super();
    this.empDb = new MyDb(initJsStore, conn, 'Pegawai');
    this.syncDb = new MyDb(initJsStore, conn, 'Sinkron');
    const dbSetting = localStorage.getItem('dbSetting');
    if (dbSetting) {
      this.dbConfig = JSON.parse(dbSetting);
    } else {
      this.dbConfig = {
        host: 'localhost',
        port: '3306',
        user: 'root',
        password: '',
        database: '',
        multipleStatements: true,
        connectionLimit: 3000
      }
      localStorage.setItem('dbSetting', JSON.stringify(this.dbConfig));
    }
    Database.init(this.dbConfig);
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
  async syncronize() {
    this.$store.dispatch('showSpinner', 'MENGAMBIL ABSENSI');
    
    // kita cari log di sinkronDate
    const todayTime = moment().format('YYYY-MM-DD HH:mm:ss'); 
    // const today = todayTime.split(' ')[0];
    const today = this.sinkronDate.split('/').reverse().join('-');
    
    const pins: string[] = [];
    const names: string[] = [];
    const aliases: string[] = [];
    const dateTimes: string[] = [];

    try {
      const logs: any[] = await Database.query(`SELECT scan_date, pin FROM att_log WHERE DATE(scan_date) = ? ORDER BY scan_date`, [today]);
      if (logs.length == 0) {
        alertify.alert('ERROR', '<strong class="text-danger">TIDAK ADA DATA ABSENSI HARI INI</strong>', function() {
          // do nothing
        });
        this.$store.dispatch('hideSpinner'); return;
      }
      
      logs.filter((v: any) => {
        const p = this.pegawaiList.find((k: PegawaiType) => k.pin == v.pin);
        return p?.active;
      }).forEach((v: any) => {
        const p = this.pegawaiList.find((k: PegawaiType) => k.pin == v.pin);
        pins.push(p?.nip || '');
        names.push(p?.nama || '');
        aliases.push(p?.namaSingkat || '');
        dateTimes.push(moment(v.scan_date).format('YYYY-MM-DD HH:mm:ss'));
      });
           
      this.$store.dispatch('changeSpinnerMessage', 'MENGIRIM DATA KE SERVER');
      // kirimkan ke server
      this.apiService.postResource('/sinkron', {
        // pin: pins, name: names, alias: aliases, dateTime: dateTimes
        pin: JSON.stringify(pins), name: JSON.stringify(names), alias: JSON.stringify(aliases), dateTime: JSON.stringify(dateTimes)
      }, true).then(async data => {
        this.$store.dispatch('hideSpinner')
        // tambahkan di database
        if (data.success) {
          this.$toast.success(`SUKSES: JUMLAH DATA TERPROSES: ${data.count}`);
          this.activateIdling();
          await this.syncDb.insert({ date: todayTime, count: data.count });
          this.loadSyncData();
        } else {
          this.$toast.error('ERROR: ' + data.message);
        }
      }).catch(err => {
        this.$store.dispatch('hideSpinner');
        this.$toast.error('ERROR: ' + err.data.message);
        this.activateIdling();
      });
    } catch(err) {
      this.$store.dispatch('hideSpinner');
      this.$toast.error(err.toString());
    }
  }

  // BAGIAN DATA PEGAWAI
  // ----------------------------------------------------------------------------------
  /* eslint-disable @typescript-eslint/no-explicit-any */
  private pegawaiList: PegawaiType[] = [];
  async loadPegawai() {
    this.pegawaiList = [];
    try {
      const rows = await Database.query(`SELECT pegawai_pin, pegawai_nip, pegawai_nama, pegawai_alias FROM pegawai`);
      if (rows.length == 0) {
        this.$toast.error('Data pegawai kosong, pastikan sudah di unduh dari mesin fingerprint!');
        return;
      }
      
      const empDb: any[] = rows.map((v: any) => {
        return { pin: v.pegawai_pin, nip: v.pegawai_nip || v.pegawai_pin, nama: v.pegawai_nama, alias: v.pegawai_alias };
      });

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

  updateStatusActive(i: number) {
    const p = this.pegawaiList[i];
    this.empDb.update({ active: p.active }, { id: p.id });
  }

  // BAGIAN LAPORAN
  // ----------------------------------------------------------------------------------
  downloadReport() {
    this.$store.dispatch('showSpinner', 'MEN-GENERATE LAPORAN');
    this.apiService.download('/absensi/harian', {
      institution: this.$store.state.user.sekolah.id,
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

  mounted() {
    this.loadPegawai();
    this.loadSyncData();
    this.sinkronDate = moment().format('DD/MM/YYYY');
  }
}
</script>

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
    width: 80px;
    height: 80px;
    border: 2px solid rgba($color: #000000, $alpha: 0.6);
    border-radius: 50%;
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
  max-height: 280px;
  padding-left: 0 !important;
  padding-right: 0 !important;
}
</style>
