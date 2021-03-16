<template>
  <div class="pt-3">
    <Header :sekolah="`KOORDINATOR KECAMATAN`"></Header>
    <div class="row px-4 mt-2">
      <div class="col">
        <form role="form">
          <div class="form-row">
            <div class="col">
              <date-picker :format="'DD/MM/YYYY'" v-model="pickedDate" :value-type="'DD/MM/YYYY'"></date-picker>
            </div>
            <div class="col">
              <select name="district" id="district" class="custom-select" @change="loadSekolah()" v-model="pickedDistrict">
                <option value="">-- pilih kecamatan --</option>
                <option :value="k.id_kecamatan" :key="k.id_kecamatan" v-for="k in districtList">{{k.nama_kecamatan}}</option>
              </select>
            </div>
            <div class="col">
             <cool-select v-model="pickedInstitution" item-value="id_sekolah" item-text="nama_sekolah" :disabled="pickedDistrict.length == 0" :items="institutionList" placeholder="Pilih Sekolah" @select="loadAbsensi()" />
            </div>
            <div class="col">
              <button type="button" class="btn btn-block btn-primary shadow-sm" v-on:click="validateData()"><i class="icon-check"></i> Validasi Absensi</button>
            </div>
          </div>
        </form>
      </div>
    </div>
    <div class="row px-4 mt-3">
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
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import Header from '@/components/Header.vue'
const DatePicker = require('vue2-datepicker').default
import { CoolSelect } from 'vue-cool-select';
import moment from 'moment';
import Api from '@/helpers/api';

@Component({
  components: {
    Header, DatePicker, CoolSelect
  }
})
export default class Home2 extends Vue {
  private apiService: Api = new Api();

  private pickedDate = '';
  private pickedDistrict = '';
  private pickedInstitution = '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private districtList: any[] = [];
  loadDistrict() {
    this.apiService.getResource('/api/kecamatan').then(data => {
      this.districtList = data;
    }).catch(err => this.$toast.error(err));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private attendanceList: any[] = [];
  loadAbsensi() {
    this.apiService.getResource('/api/absensi/temp', { sekolah: this.pickedInstitution, date: this.pickedDate }).then(data => {
      this.attendanceList = data;
    }).catch(err => this.$toast.error(err));
  }

  validateData() {
    // colnsole
  }

  mounted() {
    this.pickedDate = moment().format('DD/MM/YYYY');
    this.loadDistrict();
  }

  get allPicked() {
    if (this.pickedDate.length > 0 && this.pickedDistrict.length > 0 && this.pickedInstitution.length > 0) {
      return this.pickedDate + this.pickedDistrict + this.pickedInstitution;
    }
    return '';
  }

  @Watch('allPicked', { immediate: true }) onChange(val: string) {
    if (val) {
      console.log(this.pickedInstitution);
    }
  } 
}
</script>

<style lang="scss" scoped>
.mx-datepicker {
  width: 100% !important;
}
</style>
