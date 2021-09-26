<template>
  <div class="bg">
    <div class="row">
      <div class="col pt-5">
        <h2 class="text-center mt-4">ABSENSI DINAS PENDIDIKAN <sup class="badge badge-secondary px-1 py-1 text-muted">{{version}}</sup><br><small class="text-muted">Pemkab. Pamekasan</small></h2>
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
            <validation-observer ref="loginForm" v-slot="{ invalid }">
              <form role="form" novalidate class="form-horizontal">
                <div class="form-group row">
                  <label for="nip" class="col-sm-4 col-form-label">USERNAME</label>
                  <validation-provider tag="div" class="col-sm-8" rules="required|min:4|max:20">
                    <input type="text" v-model="user.username" required minlength="4" maxlength="20" class="form-control" id="nip">
                  </validation-provider>
                </div>
                <div class="form-group row">
                  <label for="password" class="col-sm-4 col-form-label">PASSWORDS</label>
                  <validation-provider tag="div" class="col-sm-8" rules="required|min:6|max:20">
                    <input type="password" v-model="user.password" required minlength="6" maxlength="20" name="password" id="password" class="form-control">
                  </validation-provider>
                </div>
                <div class="form-group row mb-0 mt-4">
                  <div class="col">
                    <button type="button" :disabled="invalid" class="btn btn-primary btn-xl btn-block shadow py-2" v-on:click="tryLogin()">MASUK APLIKASI</button>
                  </div>
                </div>
              </form>
            </validation-observer>
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

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { ValidationProvider, extend, ValidationObserver } from 'vee-validate'
import { required, max, min } from 'vee-validate/dist/rules'
import Api from '@/helpers/api'
import Session from '@/helpers/session'
import { ipcRenderer } from 'electron'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const alertify = require('alertifyjs')

extend('required', required);
extend('max', max);
extend('min', min);

@Component({
  components: {
    ValidationObserver, ValidationProvider
  }
})
export default class Front extends Vue {
  private apiService: Api = new Api();
  private user: { username: string; password: string } = {
    username: '', password: ''
  }

  private checkSession() {
    if (Session.getToken()) {
      this.$store.dispatch('showSpinner', 'MENGECEK AKUN');
      Session.getMe().then(data => {
        this.$store.dispatch('hideSpinner');
        for (const key in data) {
          this.$store.commit({
            type: 'changeUser', field: key, value: data[key]
          });
        }
        this.$router.replace(data.sekolah ? '/home' : '/home2');
      }).catch(err => {
        console.log(err);
        this.$store.dispatch('hideSpinner');
        // this.$toast.error('PENGECEKAN GAGAL');
      });
    }
  }

  async tryLogin() {
    this.$store.dispatch('showSpinner', 'MENGECEK AKUN');
    Session.login(this.user).then(data => {
      this.$store.dispatch('hideSpinner');
      for (const key in data) {
        this.$store.commit({
          type: 'changeUser', field: key, value: data[key]
        });
      }
      this.$router.replace(data.sekolah ? '/home' : '/home2');
    }).catch(err => {
      this.$store.dispatch('hideSpinner');
      if (err && err.data) {
        if ( ! err.data.success) {
          this.$toast.error(`LOGIN ERROR: ${err.data.error}`);
          return;
        }
      }
      if (err) {
        this.$toast.error(`LOGIN ${err.toString().toUpperCase()}`);
      } else {
        this.$toast.error('Login Gagal');
      }
    });
  }

  resetData() {
    alertify.confirm('Clear Data', 'Apakah Anda yakin akan mereset ulang data lokal aplikasi Anda?', async () => {
      localStorage.clear();
      await ipcRenderer.invoke('get-app-path');
    }, function() {
      // nothing to worry
    })
  }

  get version() {
    return this.$store.state.version; 
  }
  async mounted() {
    this.checkSession();
  }
}
</script>

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