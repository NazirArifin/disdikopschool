<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import Header from '../components/Header.vue';
import { format } from 'date-fns';
import Api from '../helpers/api';
import { useMainStore } from '../store/main';
import { useToast } from 'vue-toastification';
import VueDatePicker from '@vuepic/vue-datepicker';

const pickedDate = ref<Date>(new Date());
const apiService = new Api();
const districtList = ref<any[]>([]);
const pickedDistrict = ref('');
const institutionList = ref<any[]>([]);

const mainStore = useMainStore();
const toast = useToast();
const isKorwil = computed(() => {
  return mainStore.user.kecamatan != null;
});

// load sekolah
async function loadSekolah() {
  institutionList.value = [];
  try {
    const data = await apiService.getResource(`/api/sekolah`, { kecamatan: pickedDistrict.value });
    institutionList.value = data;
  } catch (error) {
    console.log(error);
    toast.error('Gagal memuat data');
  }
}

// load pegawai
const pickedInstitution = ref('');
const pegawaiList = ref<any[]>([]);
async function loadPegawai() {
  pegawaiList.value = [];

  try {
    const data = await apiService.getResource(`/api/pegawai`, { sekolah: pickedInstitution.value });
    pegawaiList.value = data;
  } catch (error) {
    console.log(error);
    toast.error('Gagal memuat data');
  }
}

// load absensi
const attendanceList = ref<any[]>([]);
async function loadAbsensi() {
  loadPegawai();
  attendanceList.value = [];
  const date = format(pickedDate.value, 'dd/MM/yyyy');
  if (date.length == 0 || pickedInstitution.value.length == 0) return;

  try {
    const data = await apiService.getResource(`/api/absensi/temp`, { sekolah: pickedInstitution.value, date: pickedDate.value });
    attendanceList.value = data;
  } catch (error) {
    console.log(error);
    toast.error('Gagal memuat data absensi');
  }
}

function presetDeleteItem() {
  return {
    id: 0, nama: '', tipe: '', transfer: ''
  }
}
const deleteItem = reactive(presetDeleteItem());
function setDeleteItem(i: number) {
  const item = pegawaiList.value[i];
  deleteItem.id = item.id;
  deleteItem.nama = item.nama;
}
function cancelDeleteItem() {
  Object.assign(deleteItem, presetDeleteItem());
}

async function saveDelete() {
  mainStore.showSpinner('MENGIRIM DATA...');
  try {
    const data = await apiService.postResource('/pegawai/transfer', deleteItem, false);
    console.log(data);
    toast.success('DATA PEGAWAI BERHASIL DIHAPUS!');
    Object.assign(deleteItem, presetDeleteItem());
    loadPegawai();
  } catch(error) {
    console.log(error);
    toast.error('GAGAL MENGHAPUS DATA PEGAWAI!');
  } finally {
    mainStore.hideSpinner();
  }
}

function presetUser() {
  return { username: '', password: '', id: '' };
}
const user = reactive(presetUser());
async function saveUser() {
  mainStore.showSpinner('MENGIRIM DATA...');
  try {
    user.id = pickedInstitution.value;
    const data = await apiService.postResource('/operator', user, false);
    console.log(data);
    toast.success('DATA LOGIN BERHASIL DISIMPAN!');
    Object.assign(user, presetUser());
  } catch(error) {
    console.log(error);
    toast.error('GAGAL MENYIMPAN DATA LOGIN!');
  } finally {
    mainStore.hideSpinner();
  }
}


onMounted(async () => {
  pickedDate.value = new Date();

  // load kecamatan
  try {
    let data = await apiService.getResource('/api/kecamatan');
    districtList.value = data;
    if (isKorwil.value) {
      pickedDistrict.value = mainStore.user.kecamatan.id;
      loadSekolah();
    }
  } catch (error) {
    console.log(error);
    toast.error('Gagal memuat data');
  }
});
</script>

<template>
  <div class="pt-3">
    <Header :sekolah="`KOORDINATOR KECAMATAN`"></Header>

    <div class="row px-4 mt-3">
        <div class="col-md-6">
          <form role="form">
            <div class="form-row">
              <div class="col">
                <select name="district" id="district" :disabled="isKorwil" class="custom-select" @change="loadSekolah()" v-model="pickedDistrict">
                  <option value="">-- pilih kecamatan --</option>
                  <option :value="k.id_kecamatan" :key="k.id_kecamatan" v-for="k in districtList">{{k.nama_kecamatan}}</option>
                </select>
              </div>
              <div class="col">
                <select name="institution" id="institution" class="custom-select" :disabled="pickedDistrict.length == 0" v-model="pickedInstitution" @change="loadAbsensi()">
                  <option value="">-- pilih sekolah --</option>
                  <option :value="i.id_sekolah" :key="i.id_sekolah" v-for="i in institutionList">{{ i.nama_sekolah }}</option>
                </select>
              </div>
              <!-- <div class="col">
                
              </div> -->

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
                      <VueDatePicker :format="'dd/MM/yyyy'" @change="loadAbsensi()" v-model="pickedDate"></VueDatePicker>
                      <!-- <date-picker :format="'DD/MM/YYYY'" v-model="pickedDate" @change="loadAbsensi()" :value-type="'DD/MM/YYYY'"></date-picker> -->
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
                
                  <select name="deleteType" required id="deleteType" v-model="deleteItem.tipe" class="form-control">
                    <option value="">-- pilih metode penghapusan --</option>
                    <option value="1">Hapus Pegawai &amp; Hapus Absensinya</option>
                    <option value="2">Hapus Pegawai &amp; Transfer Absensinya</option>
                  </select>
                
              </div>
              <div class="form-group" v-if="deleteItem.tipe == '2'">
                <label for="deleteTransfer">Pegawai Tujuan</label>
                <select name="deleteTransfer" id="deleteTransfer" v-model="deleteItem.transfer" class="form-control">
                  <option value="">-- pilih pegawai --</option>
                  <option :disabled="v.id == deleteItem.id" :value="v.id" :key="v.id" v-for="v in pegawaiList">{{ v.nip }} - {{v.nama}}</option>
                </select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal" @click="cancelDeleteItem()">Batal / Tutup</button>
            <button type="button" class="btn btn-primary" v-on:click="saveDelete()" data-dismiss="modal">
              <i class="icon-check"></i> Hapus Pegawai
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL UBAH USERNAME PASSWORD -->
    <div class="modal fade" id="user-modal" data-backdrop="static" data-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
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
              <div class="form-group">
                <label for="username">Username</label>
                <input type="text" name="username" id="username" class="form-control" minlength="5" maxlength="40" required v-model="user.username" placeholder="Username">
              </div>
              <div class="form-group">
                <label for="password">Password</label>
                <input type="password" name="password" id="password" class="form-control" minlength="5" maxlength="40" v-model="user.password" placeholder="Password">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal / Tutup</button>
            <button type="button" data-dismiss="modal" class="btn btn-primary shadow-sm" v-on:click="saveUser()">Simpan Login</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.mx-datepicker {
  width: 100% !important;
}
</style>