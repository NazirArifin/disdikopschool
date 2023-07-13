<script lang="ts">
declare const alertify: any;
</script>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useMainStore } from '../store/main';
import Session from '../helpers/session';
import router from '../routes';
import { useToast } from 'vue-toastification';
import { ipcRenderer } from 'electron';
import * as yup from 'yup';
import { useField, useForm } from 'vee-validate';

const mainStore = useMainStore();
const version = computed(() => mainStore.version);

const toast = useToast();
const { meta } = useForm({
  validationSchema: yup.object({
    username: yup.string().required().min(4).max(20),
    password: yup.string().required().min(6).max(20),
  }),
});
const { value: username } = useField<string>('username');
const { value: password } = useField<string>('password');

async function checkSession() {
  if (Session.getToken()) {
    mainStore.showSpinner('MENGECEK AKUN...');
    try {
      const data = await Session.getMe();
      mainStore.hideSpinner();
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const element = data[key];
          mainStore.changeUser(key, element);
        }
      }
      router.replace(data.sekolah ? '/home' : '/home2');
    } catch (error) {
      console.log(error);
    } finally {
      mainStore.hideSpinner();
    }
  }
}

async function tryLogin() {
  mainStore.showSpinner('MENGECEK AKUN...');
  try {
    const data = await Session.login({ username: username.value, password: password.value });
    mainStore.hideSpinner();
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const element = data[key];
        mainStore.changeUser(key, element);
      }
    }
    router.replace(data.sekolah ? '/home' : '/home2');
  } catch (error: any) {
    console.log(error);
    if (error && error.data) {
      if (! error.data.success) {
        toast.error(`LOGIN ERROR: ${error.data.error}`);
        return;
      }
    }
    if (error) {
      toast.error(`LOGIN ERROR: ${error.toString().toUpperCase()}`);
    } else {
      toast.error(`LOGIN ERROR: UNKNOWN ERROR`);
    }
  } finally {
    mainStore.hideSpinner();
  }
}

function resetData() {
  alertify.confirm('Clear Data', 'Apakah Anda yakin akan mereset ulang data lokal aplikasi Anda?', async () => {
    localStorage.clear();
    await ipcRenderer.invoke('get-app-path');
  }, function() {
    // nothing to worry
  });
}

onMounted(() => {
  checkSession();
});

</script>

<template>
  <div class="bg">
    <div class="row">
      <div class="col pt-5">
        <h2 class="text-center mt-4">ABSENSI DINAS PENDIDIKAN <sup class="badge badge-secondary px-1 py-1 text-muted">{{ version }}</sup><br><small class="text-muted">Pemkab. Pamekasan</small></h2>
        <p class="text-center mt-3">
          <img src="/img/pemkab.jpg" alt="pemkab" class="img-logo mr-3">
          <img src="/img/kemendikbud.png" alt="disdik" class="img-logo">
        </p>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6 offset-md-3">
        <div class="card bg-light mt-3 py-1">
          <div class="card-body shadow-sm">
            <form role="form" novalidate class="form-horizontal">
              <div class="form-group row">
                <label for="nip" class="col-sm-4 col-form-label">USERNAME</label>
                <div class="col-sm-8">
                  <input type="text" v-model="username" required minlength="4" maxlength="20" class="form-control" id="nip">
                </div>
              </div>
              <div class="form-group row">
                <label for="password" class="col-sm-4 col-form-label">PASSWORDS</label>
                <div class="col-sm-8">
                  <input type="password" v-model="password" required minlength="6" maxlength="20" name="password" id="password" class="form-control">
                </div>
              </div>
              <div class="form-group row mb-0 mt-4">
                <div class="col">
                  <button type="button" :disabled="! meta.valid" class="btn btn-primary btn-xl btn-block shadow py-2" v-on:click="tryLogin()">MASUK APLIKASI</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6 offset-md-3">
        <button v-on:click="resetData()" title="reset ulang data aplikasi" type="button" class="btn btn-sm btn-link" style="text-decoration:none"><small><i class="icon-refresh"></i></small></button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bg {
  width: 100%;
  height: 100vh;
  position: relative;
  display: block;
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    opacity: 0.3;
    background-image: url(/img/bg.jpg);
    background-repeat: no-repeat;
    background-position-x: 0;
    background-position-y: 0;
    z-index: -1;
  }
}

img.img-logo {
  height: 40px;
}

h2 {
  line-height: 1.4rem;
  small.text-muted {
    font-size: 1rem;
  }
  sup {
    font-size: 1rem;
  }
}
</style>