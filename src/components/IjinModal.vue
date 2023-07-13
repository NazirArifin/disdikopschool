<script setup lang="ts">
import { PropType, computed, onMounted, ref, watch } from 'vue';
import { PegawaiType } from '../helpers/types';
import { useField, useForm } from 'vee-validate';
import * as yup from 'yup';
import { useMainStore } from '../store/main';
import ApiService from '../helpers/api';
import VueDatePicker from '@vuepic/vue-datepicker';
// import '@vuepic/vue-datepicker/dist/main.css'
import { useToast } from 'vue-toastification';

const file = ref<File | null>(null);
  const fileLabel = computed(() => {
  if (file.value == null) {
    if (idEdited.value == 0) return 'Pilih Dokumen';
    else return 'Ganti Dokumen';
  }
  return file.value.name;
});

const mainStore = useMainStore();
const apiService = new ApiService();
const toast = useToast();

const props = defineProps({
  idSekolah: {
    type: Number,
    required: true
  },
  pegawaiList: {
    type: Array as PropType<PegawaiType[]>,
    required: true
  },
  jenisIjinList: {
    type: Array as PropType<{ id: number, val: string }[]>,
    required: true
  },
  idEdited: {
    type: Number,
    required: true
  },
  ajuanList: {
    type: Array as PropType<any[]>,
    required: true
  }
});
const emits = defineEmits(['updated']);

const { meta: metaForm, setValues } = useForm({
  validationSchema: yup.object({
    pegawai: yup.string().required(),
    jenis: yup.string().required(),
    alasan: yup.string().required(),
    keterangan: yup.string().min(3).max(80),
  })
});
const { value: pegawai } = useField<string>('pegawai');
const { value: jenis } = useField('jenis');
const { value: alasan } = useField<string>('alasan');
const { value: keterangan } = useField('keterangan');
const tanggal = ref<Date[]>([
  new Date(), new Date()
]);

const idEdited = computed(() => props.idEdited);
watch(idEdited, () => {
  if (idEdited.value > 0) {
    editAjuan();
  }
}, { immediate: true });

function editAjuan() {
  const item = props.ajuanList.find(v => v.id == idEdited.value);
  if (item) {
    const tanggal = [item.mulai.split('-').reverse().join('/'), item.akhir.split('-').reverse().join('/')];
    const f = props.jenisIjinList.find(v => v.id == item.alasan);
    let alasan = '5';
    if (f) {
      alasan = f.id.toString();
    }
    setValues({
      pegawai: item.nip,
      jenis: item.jenis,
      alasan: alasan,
      keterangan: item.alasan,
      tanggal: tanggal
    });
  }
}
function resetAjuan() {
  setValues({
    pegawai: '',
    jenis: '',
    alasan: '',
    keterangan: '',
    tanggal: []
  });
  file.value = null;
}
function updateFile(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    file.value = target.files[0];
  }
}

function saveIjin() {
  mainStore.showSpinner('MENGIRIM DATA');
  
  const ajuan: any = {
    id: idEdited.value,
    nip: pegawai.value,
    jenis: jenis.value,
    alasan: alasan.value,
    keterangan: keterangan.value,
    tanggal: tanggal.value,
    dokumen: file.value,
    sekolah: props.idSekolah
  };
  ajuan.value.sekolah = props.idSekolah.toString();
  if (Array.isArray(ajuan.value.tanggal)) {
    ajuan.value.tanggal = ajuan.value.tanggal.join(',');
  }
  apiService.postResource('/ijin/ajuan', ajuan, true).then(() => {
    mainStore.hideSpinner();
    toast.success('Data ajuan berhasil disimpan');
    resetAjuan();
    emits('updated');
  }).catch(err => {
    toast.error(err.toString());
    mainStore.hideSpinner();
  });
}

onMounted(() => {
  resetAjuan();
});
</script>

<template>
  <!-- MODAL EDIT / TAMBAH PENGAJUAN IJIN -->
  <div class="modal fade" id="ijin-modal" data-backdrop="static" data-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content" style="max-height: 490px;overflow-x: auto;">
        <div class="modal-header">
          <h5 class="modal-title">Pengajuan Ijin</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <form role="form" name="formIjin">
            <div class="form-group">
              <label for="ijinPegawai">Pilih Pegawai</label>              
              <select name="ijinPegawai" id="ijinPegawai" v-model="pegawai" class="form-control">
                <option value="">-- pilih pegawai --</option>
                <option :value="v.nip" :key="v.pin" v-for="v in pegawaiList.filter(v => v.active)">{{v.nama}}</option>
              </select>
            </div>
            <div class="form-group">
              <label for="ijinJenis">Jenis Ijin</label>
              <select name="ijinJenis" required id="ijinJenis" v-model="jenis" class="form-control">
                <option value="">-- jenis ijin --</option>
                <option :value="v.id" :key="v.id" v-for="v in jenisIjinList">{{v.val}}</option>
              </select>
            </div>
            <div class="form-group" v-if="idEdited == 0">
              <label for="ijinAlasan">Alasan</label>
              <select name="ijinAlasan" required id="ijinAlasan" v-model="alasan" class="form-control">
                <option value="">-- alasan ijin --</option>
                <option value="1">Keperluan Pribadi</option>
                <option value="2">Keperluan Kantor</option>
                <option value="3">Sakit</option>
                <option value="4">Cuti Normatif</option>
                <option value="5">Lainnya</option>
              </select>
            </div>
            <div class="form-group" v-if="parseInt(alasan) == 5 || idEdited > 0">
              <label for="ijinKeterangan">Detail Alasan</label>
              <input type="text" name="ijinKeterangan" minlength="3" maxlength="80" v-model="keterangan" id="ijinKeterangan" class="form-control">
            </div>
            <div class="form-group">
              <label for="ijinTanggal">Tanggal</label>
              <VueDatePicker v-model="tanggal" range format="dd/MM/yyyy" :enable-time-picker="false" :teleport="true" locale="id" select-text="Pilih" cancel-text="Batal"></VueDatePicker>

              <!-- <date-picker :format="'DD/MM/YYYY'" style="display: block !important; width: 100%;" v-model="ajuan.tanggal" :value-type="'DD/MM/YYYY'" range></date-picker>
              <small id="tanggalHelpBlock" class="form-text text-muted">
                Untuk memilih tanggal tunggal, lakukan double click pada tanggal tersebut
              </small> -->
            </div>
            <div class="form-group">
              <label for="ijinDokumen" class="text-muted">Dokumen Pendukung (opsional)</label>
              <div class="custom-file">
                <input type="file" class="custom-file-input" accept=".docx,.pdf,.jpg,.jpeg,.png" id="ijinDokumen" @change="updateFile">
                <label class="custom-file-label" for="ijinDokumen">{{ fileLabel }}</label>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal" v-on:click="resetAjuan()">Batal / Tutup</button>
          <button type="button" data-dismiss="modal" class="btn btn-primary shadow-sm" v-on:click="saveIjin()" :disabled="! metaForm.valid">Simpan Pengajuan</button>
        </div>
      </div>
    </div>
  </div>
</template>