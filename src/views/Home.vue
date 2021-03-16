<template>
  <div class="pt-3">
    <Header :sekolah="sekolah"></Header>

    <div class="row mt-5">
      <div class="col-8 offset-2">
        <div class="row">
          <div class="col d-flex justify-content-start">
            <div class="d-flex flex-column align-items-center main-icon-menu" v-on:click="changeMenu('sinkron')" :class="{ 'inactive': activeMenu != 'sinkron' }">
              <div class="icon-container p-3">
                <img src="/img/003-immigration.png" class="" alt="absensi">
              </div>
              <p class="mt-1 font-weight-bold icon-label">SINKRON ABSENSI</p>
            </div>
          </div>
          <div class="col d-flex justify-content-center">
            <div class="d-flex flex-column align-items-center main-icon-menu" v-on:click="changeMenu('report')" :class="{ 'inactive': activeMenu != 'report' }">
              <div class="icon-container p-3">
                <img src="/img/002-seo-report.png" alt="laporan">
              </div>
              <p class="mt-1 font-weight-bold icon-label">LIHAT LAPORAN</p>
            </div>
          </div>
          <div class="col d-flex justify-content-end">
            <div class="d-flex flex-column align-items-center main-icon-menu" v-on:click="changeMenu('fprint')" :class="{ 'inactive': activeMenu != 'fprint' }">
              <div class="icon-container p-3">
                <img src="/img/001-fingerprint.png" alt="fingerprint">
              </div>
              <p class="mt-1 font-weight-bold icon-label">MESIN ABSENSI</p>
            </div>
          </div>
        </div>

        <!-- MENU SINKRON -->
        <div class="row mt-3" v-if="activeMenu == 'sinkron'">
          <div class="col card-container">
            <div class="card shadow-sm">
              <div class="card-body">
                <div class="row" v-if="fpList.length > 0">
                  <div class="col-8 offset-2">
                    <p class="last-sync-info mb-2 mt-4">Terakhir Sinkron: {{lastSync}}</p>
                    <p class="mb-3">
                      <button type="button" class="btn btn-lg btn-block btn-danger py-3 shadow-sm" :disabled="inIdling" v-on:click="syncronize()">Sinkron Absensi Sekarang</button>
                    </p>
                    <p class="mb-4">
                      <button class="btn btn-sm btn-dark view-sync-history" data-toggle="modal" data-target="#sync-modal" :disabled="syncList.length == 0" type="button">
                        <i class="icon-folder-alt"></i> Lihat Histori Sinkronisasi
                      </button>
                    </p>
                  </div>
                </div>

                <div class="row" v-else>
                  <div class="col-8 offset-2">
                    <p class="last-sync-info mb-2 mt-4">Tambahkan mesin pada menu Mesin Absensi</p>
                    <p class="mb-3">
                      <button type="button" disabled class="btn btn-lg btn-block btn-outline-danger py-3 shadow-sm">Belum Ada Mesin Terdeteksi</button>
                    </p>
                    <p class="mb-4">
                      <button class="btn btn-sm btn-dark view-sync-history" type="button" data-toggle="modal" data-target="#sync-modal" :disabled="syncList.length == 0">
                        <i class="icon-folder-alt"></i> Lihat Histori Sinkronisasi
                      </button>
                    </p>
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
                    <div class="col-8 offset-2">
                      <button type="button" class="btn btn-primary btn-lg btn-block shadow-sm py-2" :disabled="reportDate.length == 0" v-on:click="downloadReport()">Buat Laporan &amp; Unduh</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <!-- MENU FINGER PRINT -->
        <div class="row mt-3" v-if="activeMenu == 'fprint'">
          <div class="col card-container">
            <div class="card shadow-sm">
              <div class="card-body">
                <div class="row">
                  <div class="col text-right">
                    <button type="button" class="btn btn-outline-primary btn-sm shadow-sm" data-toggle="modal" data-target="#fp-modal">
                      <i class="icon-plus"></i> Tambah Mesin FP
                    </button>
                  </div>
                </div>
                <div class="row mt-3">
                  <div class="col">
                    <table class="table mb-0">
                      <thead class="thead-dark">
                        <tr>
                          <th>IP</th>
                          <th>Port</th>
                          <th>ComKey / SN</th>
                          <th colspan="3"></th>
                        </tr>
                      </thead>
                      <tbody v-if="fpList.length > 0">
                        <tr :key="fp.id" v-for="(fp, i) in fpList">
                          <td class="align-middle" :class="{ 'font-weight-bold': fp.active }">{{fp.ip}}</td>
                          <td class="align-middle" :class="{ 'font-weight-bold': fp.active }">{{fp.port}}</td>
                          <td class="align-middle" :class="{ 'font-weight-bold': fp.active }">{{fp.keyCom}}</td>
                          <td class="align-middle">
                            <i class="icon-check text-success" v-if="fp.active"></i>
                          </td>
                          <td class="align-middle">
                            <a href="" class="btn btn-info btn-sm" v-if="fp.active" v-on:click.prevent="pingFp()"><i class="icon-energy"></i> Tes Koneksi</a>
                          </td>
                          <td class="align-middle text-right">
                            <div class="btn-group">
                              <a href="" class="btn btn-sm btn-outline-success" v-if=" ! fp.active" v-on:click.prevent="activateFp(i)">SET AKTIF</a>

                              <a href="" class="btn btn-sm btn-warning" v-on:click.prevent="editFp(i)" data-toggle="modal" data-target="#fp-modal" title="EDIT"><i class="icon-pencil"></i></a>
                              <a href="" v-on:click.prevent="deleteFp(i)" class="btn btn-sm btn-outline-danger">HAPUS</a>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                      <tbody v-else>
                        <tr>
                          <td colspan="3">
                            <p class="text-center font-weight-bold">Tidak Ada Data Mesin Finger Print</p>
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
              <h5 class="modal-title">Perangkat Finger Print</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <form role="form" name="formFP">
                <validation-provider slim name="ip" rules="required|min:8|max:40">
                  <div class="form-group">
                    <label for="ip">Alamat IP</label>
                    <input type="text" name="ip" id="ip" class="form-control" minlength="8" maxlength="40" required v-model="fpModel.ip" placeholder="0.0.0.0">
                    <small id="ipHelp" class="form-text text-muted">Alamat IP perangkat Finger Print</small>
                  </div>
                </validation-provider>
                <validation-provider slim name="keyCom" rules="required|min:1|max:40">
                  <div class="form-group">
                    <label for="keyCom">Serial Number</label>
                    <input type="text" name="keyCom" id="keyCom" class="form-control" minlength="1" maxlength="40" required v-model="fpModel.keyCom">
                    <small id="keyComHelp" class="form-text text-muted">Communication Key / Serial Number</small>
                  </div>
                </validation-provider>
                <validation-provider slim name="port" rules="required|min:1|max:8">
                  <div class="form-group">
                    <label for="keyCom">Port</label>
                    <input type="text" name="port" id="port" class="form-control" minlength="1" maxlength="8" required v-model="fpModel.port">
                  </div>
                </validation-provider>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal / Tutup</button>
              <button type="button" data-dismiss="modal" class="btn btn-primary shadow-sm" v-on:click="saveFp()" :disabled="invalid">Simpan Perangkat</button>
            </div>
          </div>
        </div>
      </validation-observer>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Header from '@/components/Header.vue'
const DatePicker = require('vue2-datepicker').default
import 'vue2-datepicker/locale/id'
import { FPType, SyncType, MyDb } from '@/services/mydb'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const alertify = require('alertifyjs');
import { ValidationProvider, ValidationObserver, extend } from 'vee-validate'
import { required, min, max } from 'vee-validate/dist/rules'
import FPSocket from '@/helpers/fp'
import { initJsStore, conn } from '@/services/idb'
import * as convert from "xml-js"
import moment from 'moment'
import Api from '@/helpers/api'

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
  private fpDb: MyDb;
  private syncDb: MyDb;
  private fp: FPSocket|null = null;
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

  changeMenu(menu: string) {
    this.activeMenu = menu;
  }

  constructor() {
    super();
    this.fpDb = new MyDb(initJsStore, conn, 'FingerPrint');
    this.syncDb = new MyDb(initJsStore, conn, 'Sinkron');
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
    this.$store.dispatch('showSpinner', 'MEMULAI');
    
    try {
      this.$store.dispatch('changeSpinnerMessage', 'MEMUAT DATA PEGAWAI');
      let xml = await this.fp?.getUser();
      // let xml = `<GetAllUserInfoResponse><Row><PIN>1</PIN><Name>Ubaidi, S.Kom, M.Kom</Name><Password></Password><Group>1</Group><Privilege>14</Privilege><Card>0</Card><PIN2>1</PIN2><TZ1>0</TZ1><TZ2>0</TZ2><TZ3>0</TZ3></Row></GetAllUserInfoResponse>`;

      let data = JSON.parse(convert.xml2json(xml, { compact: true }));
      const users: { pin: string; name: string }[] = [];
      if (Object.prototype.hasOwnProperty.call(data, 'GetAllUserInfoResponse')) {
        if (Object.prototype.hasOwnProperty.call(data.GetAllUserInfoResponse, 'Row')) {
          const Rows = data.GetAllUserInfoResponse.Row;
          if (Array.isArray(Rows)) {
            Rows.forEach(row => {
              users.push({
                pin: row.PIN._text, name: row.Name._text
              });
            });
          } else {
            users.push({
              pin: Rows.PIN._text, name: Rows.Name._text
            });
          }
        }
        this.userList = Object.freeze(users);
      }
      
      this.$store.dispatch('changeSpinnerMessage', 'MEMUAT DATA ABSENSI');
      xml = await this.fp?.getLog();
      // xml = `<GetAttLogResponse><Row><PIN>1</PIN><DateTime>2021-03-11 06:51:25</DateTime><Verified>1</Verified><Status>0</Status><WorkCode>0</WorkCode></Row><Row><PIN>1</PIN><DateTime>2021-03-11 13:51:39</DateTime><Verified>1</Verified><Status>0</Status><WorkCode>0</WorkCode></Row><Row><PIN>1</PIN><DateTime>2017-11-01 13:51:42</DateTime><Verified>1</Verified><Status>0</Status><WorkCode>0</WorkCode></Row></GetAttLogResponse>`;
      
      data = JSON.parse(convert.xml2json(xml, { compact: true }));
      const logs: { pin: string; dateTime: string }[] = [];
      if (Object.prototype.hasOwnProperty.call(data, 'GetAttLogResponse')) {
        if (Object.prototype.hasOwnProperty.call(data.GetAttLogResponse, 'Row')) {
          const Rows = data.GetAttLogResponse.Row;
          if (Array.isArray(Rows)) {
            Rows.forEach(row => {
              logs.push({
                pin: row.PIN._text, dateTime: row.DateTime._text
              });
            });
          } else {
            logs.push({
              pin: Rows.PIN._text, dateTime: Rows.DateTime._text
            });
          }
        }
        this.logList = Object.freeze(logs);
      }

      this.$store.dispatch('changeSpinnerMessage', 'MEMPROSES DATA');
      // kita cari log hari ini
      const todayTime = moment().format('YYYY-MM-DD HH:mm:ss'); 
      const today = todayTime.split(' ')[0];
      const pins: string[] = [];
      const names: string[] = [];
      const dateTimes: string[] = [];
      this.logList.filter(v => {
        return v.dateTime.split(' ')[0] == today;
      }).forEach(v => {
        pins.push(v.pin);
        names.push(this.userList.find(u => u.pin == v.pin)?.name || '');
        dateTimes.push(v.dateTime);
      });

      if (pins.length == 0) {
        alertify.alert('ERROR', '<strong class="text-danger">TIDAK ADA DATA ABSENSI HARI INI</strong>', function() {
          // do nothing
        });
        this.$store.dispatch('hideSpinner');
        return;
      }
      
      this.$store.dispatch('changeSpinnerMessage', 'MENGIRIM DATA KE SERVER');
      // kirimkan ke server
      this.apiService.postResource('/sinkron', {
        pin: pins, name: names, dateTime: dateTimes
      }, true).then(async data => {
        this.$store.dispatch('hideSpinner')
        this.$toast.success(`SUKSES: JUMLAH DATA TERPROSES: ${data.count}`);
        this.activateIdling();

        // tambahkan di database
        await this.syncDb.insert({ date: todayTime, count: data.count });
        this.loadSyncData();
      }).catch(err => {
        this.$store.dispatch('hideSpinner');
        if (err.status == 304) {
          this.$toast.error('ERROR: Tidak ada perubahan data!');
          this.activateIdling();
        } else {
          this.$toast.error(`ERROR: ${err.status}`);
        }
      });
    } catch(err) {
      this.$toast.error(err.toString());
      this.$store.dispatch('hideSpinner');
    }
  }


  // BAGIAN FINGER PRINT
  // ----------------------------------------------------------------------------------
  private fpList: FPType[] = [];
  async loadFPData() {
    this.fpList = await this.fpDb.getAll();
    // set fp (FPSocket ke yang aktif)
    if (this.fpList.length > 0) {
      const item = this.fpList.find((v: FPType) => v.active);
      if (item) {
        this.fp = new FPSocket(item.ip, item.keyCom, item.port);
      } else {
        // set active yang pertama, mencegah tidak ada mesin yang aktif
        await this.fpDb.update({ active: true }, { id: this.fpList[0].id });
        this.fpList = await this.fpDb.getAll();
      }
    } else {
      this.fp = null;
    }
  }
  private fpModel: FPType = this.resetFpModel();
  private resetFpModel(): FPType {
    return {
      id: 0, ip: '', keyCom: '0', port: '80', active: false
    };
  }
  async saveFp() {
    if (this.fpModel.id == 0) {
      const insert = await this.fpDb.insert({
        ip: this.fpModel.ip, keyCom: this.fpModel.keyCom, port: this.fpModel.port, active: this.fpList.length == 0
      });
      if (insert) {
        this.fpModel = this.resetFpModel();
        this.loadFPData();
      }
    } else {
      await this.fpDb.update({ ip: this.fpModel.ip, keyCom: this.fpModel.keyCom, port: this.fpModel.port }, { id: this.fpModel.id });
      this.fpModel = this.resetFpModel();
      this.loadFPData();
    }
  }
  deleteFp(i: number) {
    alertify.confirm('Hapus Perangkat', 'Apakah Anda yakin menghapus perangkat ini?', async () => {
      await this.fpDb.delete({
        id: this.fpList[i].id
      });
      this.loadFPData();
    }, function() {
      // cancel edit
    });
  }
  editFp(i: number) {
    this.fpModel = this.fpList[i];
  }
  async activateFp(i: number) {
    for await (const item of this.fpList) {
      if (item.active) {
        this.fpDb.update({ active: false }, { id: item.id });
      }
    }
    await this.fpDb.update({ active: true }, { id: this.fpList[i].id });
    this.loadFPData();
  }
  pingFp() {
    this.$store.dispatch('showSpinner', 'MEMINTA DATA');
    this.fp?.getClock().then(result => {
      this.$store.dispatch('hideSpinner');
      const data = JSON.parse(convert.xml2json(result, { compact: true }));
      
      if (Object.prototype.hasOwnProperty.call(data, 'GetDateResponse')) {
        if (Object.prototype.hasOwnProperty.call(data.GetDateResponse, 'Row')) {
          const Row = data.GetDateResponse.Row;
          const tanggal = Row.Date._text;
          const time = Row.Time._text;
          alertify.alert('KONEKSI SUKSES', `<strong class="text-success">BERHASIL MENGAMBIL DATA TANGGAL:</strong><br><small class="text-muted">${tanggal.split('-').reverse().join('/')} ${time}</small>`, function() {
            // do nothing
          });   
        }
      }
    }).catch(err => {
      this.$store.dispatch('hideSpinner');
      this.$toast.error(`${err.toString()}`);
    });
  }


  // BAGIAN LAPORAN
  // ----------------------------------------------------------------------------------
  downloadReport() {
    this.$store.dispatch('showSpinner', 'MEMPROSES DATA');
    this.apiService.download('/absensi/harian', {
      institution: this.$store.state.user.sekolah.id,
      start: this.reportDate[0],
      end: this.reportDate[1],
      excel: 3
    }).then(() => {
      this.$store.dispatch('hideSpinner');
    }).catch(() => {
      this.$store.dispatch('hideSpinner');
    });
  }

  mounted() {
    this.loadFPData();
    this.loadSyncData();
  }
  
  created() {
    document.title = `APLIKASI ABSENSI - ${this.sekolah}`;
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
