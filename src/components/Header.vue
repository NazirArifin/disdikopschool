<script lang="ts">
declare const alertify: any;
</script>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Session from '../helpers/session';
import router from '../routes';
import { useMainStore } from '../store/main';
import { id } from 'date-fns/locale';
import { format } from 'date-fns';
import Sdk from '../services/sdk';
import { ipcRenderer } from 'electron';

const props = defineProps({
  sekolah: {
    type: String, required: true
  }
});
const emits = defineEmits(['sdk-active', 'db-active']);

const mainStore = useMainStore();
const version = computed(() => mainStore.version);
const sekolahAndVersion = computed(() => {
  if (props.sekolah.length > 0) {
    return true;
  }
  return false;
});

const dateToday = ref('');
const timeToday = ref('');
const dbActive = ref(false);
const sdkActive = ref(false);

async function checkDb() {
  try {
    await ipcRenderer.invoke('db-quick-check');
    dbActive.value = true;
    emits('db-active', true);
  } catch(e) {
    console.log(e)
    alertify.alert('ERROR', '<strong class="text-danger">PERCOBAAN KONEKSI KE DATABASE GAGAL!</strong>', function() {
      // do nothing
    });
  }
}

async function checkSdk() {
  const sdk: Sdk = Sdk.getInstance();
  if (! sdk.getHost().includes('127.0.0.1')) {
    try {
      await sdk.quickCheckConnection();
      sdkActive.value = true;
      emits('sdk-active', true);
    } catch(e) {
      // console.log(e)
      // do nothing
    }
  }
}

function logout() {
  Session.logout();
  router.replace('/');
  document.title = `APLIKASI ABSENSI ${version.value} - OPERATOR SEKOLAH`;
}

watch(sekolahAndVersion, (val) => {
  if (val) {
    document.title = `APLIKASI ABSENSI ${version.value} - ${props.sekolah}`;
  }
}, { immediate: true });

onMounted(() => {
  // date today
  dateToday.value = format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id }).toUpperCase();
  // time today
  timeToday.value = format(new Date(), 'HH:mm', { locale: id });

  // fetch date and time
  fetch(`https://timeapi.io/api/Time/current/zone?timeZone=Asia/Jakarta`).then(response => response.json()).then(data => {
    const dateApi = format(new Date(data.dateTime), 'EEEE, dd MMMM yyyy', { locale: id }).toUpperCase();
    if (dateApi != dateToday.value) {
      alertify.alert('ERROR', '<strong class="text-danger">TANGGAL KOMPUTER TIDAK VALID!</strong>', function() {
        // do nothing
      });
    }

    // clock interval
    setInterval(() => {
      timeToday.value = format(new Date(), 'HH:mm', { locale: id });
      dateToday.value = format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id }).toUpperCase();
    }, 1000);
  });
  checkSdk();
  checkDb();
});
</script>

<template>
  <div class="row px-4">
    <div class="col-md-4 left-part">
      <h5 class="font-weight-bold mb-0">{{ props.sekolah }}</h5>
      <p class="font-weight-bold">{{ dateToday }}<br>{{ timeToday }} WIB</p>
    </div>

    <div class="col-md-5 offset-md-3 text-right right-part" v-if="sekolah != 'KOORDINATOR KECAMATAN'">
      <span class="badge py-1 align-top mr-1" :class="dbActive ? 'badge-success' : 'badge-danger'">DB</span>
      <span class="badge py-1 align-top mr-2" :class="sdkActive ? 'badge-success' : 'badge-danger'">SDK</span>

      <button type="button" class="btn btn-outline-info py-2 mr-2" title="setting database" data-toggle="modal" data-target="#fp-modal"><i class="icon-settings"></i></button>
      <button class="btn btn-lg btn-danger shadow-sm py-2" type="button" @click="logout()">Hapus Session / Keluar</button>
    </div>
    <div class="col-md-4 offset-md-4 text-right right-part" v-else>
      <button class="btn btn-lg btn-danger shadow-sm py-2" type="button" @click="logout()">Hapus Session / Keluar</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.left-part {
  h5 {
    font-size: 13px;
  }
  p {
    font-size: .6rem;
    line-height: .5rem;
    color:rgba($color: #000000, $alpha: .5)
  }
}
.right-part {
  button {
    font-size: 13px;
  }
}
</style>