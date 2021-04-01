<template>
  <div class="pt-3">
    <Header :sekolah="`KOORDINATOR KECAMATAN`"></Header>
    
    <div class="row px-4 mt-3">
      <div class="col-md-6">
        <form role="form">
          <div class="form-row">
            <div class="col">
              <select name="district" id="district" class="custom-select" @change="loadSekolah()" v-model="pickedDistrict">
                <option value="">-- pilih kecamatan --</option>
                <option :value="k.id_kecamatan" :key="k.id_kecamatan" v-for="k in districtList">{{k.nama_kecamatan}}</option>
              </select>
            </div>
            <div class="col">
              <cool-select v-model="pickedInstitution" item-value="id_sekolah" item-text="nama_sekolah" :disabled="pickedDistrict.length == 0" :items="institutionList" placeholder="Pilih Sekolah" @select="loadAbsensi()" />
            </div>
            <!-- <div class="col">
              <date-picker :format="'DD/MM/YYYY'" v-model="pickedDate" @change="loadAbsensi()" :value-type="'DD/MM/YYYY'"></date-picker>
            </div> -->
          </div>
        </form>
      </div>
    </div>

    <div class="row px-4 mt-3">
      <div class="col">
        <ul class="nav nav-fill nav-tabs">
          <li class="nav-item">
            <a class="nav-link active" data-toggle="tab" role="tab" href="#pegawai">Pegawai</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" data-toggle="tab" role="tab" href="#absensi">Absensi Harian</a>
          </li>
        </ul>
        <div class="tab-content" id="tabcontent">
          <div class="tab-pane fade show active" id="pegawai" role="tabpanel" aria-labelledby="pegawai-tab">
            <div class="row mt-2">
              <div class="col-md-3 offset-md-9">
                <form role="form">
                  <div class="form-row">
                    <div class="col">
                      <button type="button" data-toggle="modal" data-target="#user-modal" :disabled=" ! pickedInstitution" class="btn btn-block btn-warning shadow-sm">TAMBAH/UBAH LOGIN OPERATOR</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col">
                <table class="table table-bordered table-striped table-sm table-hover">
                  <thead class="thead-dark">
                    <tr>
                      <th>#</th>
                      <th>NIP</th>
                      <th>NAMA</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody v-if="pegawaiList.length == 0">
                    <tr>
                      <td colspan="7">
                        <p class="text-center mt-4">TIDAK ADA DATA KARYAWAN</p>
                      </td>
                    </tr>
                  </tbody>
                  <tbody v-else>
                    <tr v-for="(pegawai, i) in pegawaiList" :key="pegawai.id">
                      <td>{{i + 1}}</td>
                      <td>{{pegawai.nip}}</td>
                      <td>{{pegawai.nama}}</td>
                      <td>
                        <button type="button" data-toggle="modal" data-target="#delete-modal" @click="setDeleteItem(i)" class="btn btn-sm btn-danger"><i class="icon-trash"></i></button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="tab-pane fade" id="absensi" role="tabpanel" aria-labelledby="absensi-tab">
            <div class="row mt-2">
              <div class="col-md-3 offset-md-9">
                <form role="form">
                  <div class="form-row">
                    <div class="col">
                      <date-picker :format="'DD/MM/YYYY'" v-model="pickedDate" @change="loadAbsensi()" :value-type="'DD/MM/YYYY'"></date-picker>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col">
                <table class="table table-bordered table-striped table-sm table-hover">
                  <thead class="thead-dark">
                    <tr>
                      <th rowspan="2" class="align-middle">#</th>
                      <th rowspan="2" class="align-middle">NIP</th>
                      <th rowspan="2" class="align-middle">NAMA</th>
                      <th colspan="4" class="text-center">ABSENSI</th>
                    </tr>
                    <tr>
                      <th>MASUK</th>
                      <th>TERLAMBAT</th>
                      <th>KELUAR</th>
                      <th>PULANG AWAL</th>
                    </tr>
                  </thead>
                  <tbody v-if="attendanceList.length == 0">
                    <tr>
                      <td colspan="7">
                        <p class="text-center mt-4">TIDAK ADA DATA ABSENSI</p>
                      </td>
                    </tr>
                  </tbody>
                  <tbody v-else>
                    <tr :key="i" v-for="(att, i) in attendanceList">
                      <td>{{i + 1}}</td>
                      <td>{{att.nip}}</td>
                      <td>{{att.nama}}</td>
                      <td>{{att.inScan}}</td>
                      <td>{{att.late}}</td>
                      <td>{{att.outScan}}</td>
                      <td>{{att.early}}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>  
    </div>

    <!-- MODAL HAPUS PEGAWAI -->
    <div class="modal fade" id="delete-modal" data-backdrop="static" data-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
      <validation-observer ref="formDelete" slim v-slot="{ invalid }">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">HAPUS: <strong>{{deleteItem.nama}}</strong></h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body" style="overflow: auto">
              <form role="form" name="formDelete">
                <p class="alert alert-warning shadow-sm"><small>Periksa ulang data yang Anda masukkan, kesalahan input tidak dapat diulang dan bisa berakibat fatal</small></p>
                <div class="form-group">
                  <label for="deleteType">Metode Penghapusan</label>
                  <validation-provider slim name="deleteType" rules="required">
                    <select name="deleteType" required id="deleteType" v-model="deleteItem.tipe" class="form-control">
                      <option value="">-- pilih metode penghapusan --</option>
                      <option value="1">Hapus Pegawai &amp; Hapus Absensinya</option>
                      <option value="2">Hapus Pegawai &amp; Transfer Absensinya</option>
                    </select>
                  </validation-provider>
                </div>
                <div class="form-group" v-if="deleteItem.tipe == '2'">
                  <label for="deleteTransfer">Pegawai Tujuan</label>
                  <validation-provider slim name="deleteTransfer" rules="required">
                    <select name="deleteTransfer" id="deleteTransfer" v-model="deleteItem.transfer" class="form-control">
                      <option value="">-- pilih pegawai --</option>
                      <option :disabled="v.id == deleteItem.id" :value="v.id" :key="v.id" v-for="v in pegawaiList">{{v.nama}}</option>
                    </select>
                  </validation-provider>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal" @click="cancelDeleteItem()">Batal / Tutup</button>
              <button type="button" :disabled="invalid" class="btn btn-primary" v-on:click="saveDelete()" data-dismiss="modal">
                <i class="icon-check"></i> Hapus Pegawai
              </button>
            </div>
          </div>
        </div>
      </validation-observer>
    </div>

    <!-- MODAL UBAH USERNAME PASSWORD -->
    <div class="modal fade" id="user-modal" data-backdrop="static" data-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
      <validation-observer ref="formUser" slim v-slot="{ invalid }">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Ubah/Tambah Login Operator</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <form role="form" name="formUser">
                <validation-provider slim name="username" rules="required|min:5|max:40">
                  <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" name="username" id="username" class="form-control" minlength="5" maxlength="40" required v-model="user.username" placeholder="Username">
                  </div>
                </validation-provider>
                <validation-provider slim name="password" rules="min:5|max:40">
                  <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" name="password" id="password" class="form-control" minlength="5" maxlength="40" v-model="user.password" placeholder="Password">
                  </div>
                </validation-provider>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal / Tutup</button>
              <button type="button" data-dismiss="modal" class="btn btn-primary shadow-sm" v-on:click="saveUser()" :disabled="invalid">Simpan Login</button>
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
import { CoolSelect } from 'vue-cool-select'
import moment from 'moment';
import Api from '@/helpers/api'
import { ValidationProvider, ValidationObserver, extend } from 'vee-validate'
import { required, min, max } from 'vee-validate/dist/rules'

extend('required', required);
extend('min', min);
extend('max', max);

@Component({
  components: {
    Header, DatePicker, CoolSelect,
    ValidationProvider, ValidationObserver
  }
})
export default class Home2 extends Vue {
  private apiService: Api = new Api();

  private pickedDate = '';
  private pickedDistrict = '';
  private pickedInstitution = '';

  private districtList: any[] = [];
  loadDistrict() {
    this.apiService.getResource('/api/kecamatan').then(data => {
      this.districtList = data;
    }).catch(err => this.$toast.error(err));
  }

  private institutionList: any[] = [];
  loadSekolah() {
    if ( ! this.pickedDistrict) {
      this.institutionList = [];
      return;
    }
    this.apiService.getResource('/api/sekolah', { kecamatan: this.pickedDistrict }).then(data => {
      this.institutionList = data;
    }).catch(err => this.$toast.error(err));
  }

  private pegawaiList: any[] = [];
  loadPegawai() {
    this.pegawaiList = [];

    if (this.pickedInstitution.length == 0) return;

    this.apiService.getResource('/api/pegawai', { sekolah: this.pickedInstitution }).then(data => {
      this.pegawaiList = data;
    });
  }

  private attendanceList: any[] = [];
  loadAbsensi() {
    this.loadPegawai();

    this.attendanceList = [];
    if (this.pickedDate.length == 0 || this.pickedInstitution.length == 0) return;

    this.apiService.getResource('/api/absensi/temp', { sekolah: this.pickedInstitution, date: this.pickedDate }).then(data => {
      this.attendanceList = data;
    }).catch(err => this.$toast.error(err));
  }

  presetDeleteItem() {
    return {
      id: 0, nama: '', tipe: '', transfer: ''
    };
  }
  private deleteItem: {
    id: number; nama: string; tipe: string; transfer: string;
  } = this.presetDeleteItem(); 
  setDeleteItem(i: number) {
    const item = this.pegawaiList[i];
    this.deleteItem.id = item.id;
    this.deleteItem.nama = item.nama;
  }
  cancelDeleteItem() {
    this.deleteItem = this.presetDeleteItem();
  }

  saveDelete() {
    this.$store.dispatch('showSpinner', 'MENGIRIM DATA');
    this.apiService.postResource('/pegawai/transfer', this.deleteItem, false).then(data => {
      console.log(data);
      this.$toast.success('DATA PEGAWAI BERHASIL DIHAPUS!');
      this.$store.dispatch('hideSpinner');
      this.deleteItem = this.presetDeleteItem();
      this.loadPegawai();
    }).catch(err => {
      this.$toast.error(err.toString());
      this.$store.dispatch('hideSpinner');
    });
  }

  presetUser() {
    return { username: '', password: '', id: '' };
  }
  private user: { username: string; password: string; id: string } = this.presetUser();

  saveUser() {
    this.$store.dispatch('showSpinner', 'MENGIRIM DATA');
    this.user.id = this.pickedInstitution;
    this.apiService.postResource('/operator', this.user, false).then(data => {
      console.log(data);
      this.$toast.success('DATA LOGIN BERHASIL DIUBAH!');
      this.user = this.presetUser();
      this.$store.dispatch('hideSpinner');
    }).catch(err => {
      this.$toast.error(err.toString());
      this.$store.dispatch('hideSpinner');
    });
  }

  mounted() {
    this.pickedDate = moment().format('DD/MM/YYYY');
    this.loadDistrict();
  }
}
</script>

<style lang="scss" scoped>
.mx-datepicker {
  width: 100% !important;
}
</style>
