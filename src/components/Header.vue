<template>
  <div class="row px-4">
    <div class="col-md-4 left-part">
      <h5 class="font-weight-bold mb-0">{{sekolah}}</h5>
      <p class="font-weight-bold">{{dateToday}}<br>{{timeToday}} WIB</p>
    </div>

    <div class="col-md-5 offset-md-3 text-right right-part" v-if="sekolah != 'KOORDINATOR KECAMATAN'">
      <span class="badge py-1 align-top mr-1" :class="dbActive ? 'badge-success' : 'badge-danger'">DB</span>
      <span class="badge py-1 align-top mr-2" :class="sdkActive ? 'badge-success' : 'badge-danger'">SDK</span>

      <button type="button" class="btn btn-outline-info py-2 mr-2" title="setting database" data-toggle="modal" data-target="#fp-modal"><i class="icon-settings"></i></button>
      <button class="btn btn-lg btn-danger shadow-sm py-2" type="button" v-on:click="logout()">Hapus Session / Keluar</button>
    </div>
    <div class="col-md-4 offset-md-4 text-right right-part" v-else>
      <button class="btn btn-lg btn-danger shadow-sm py-2" type="button" v-on:click="logout()">Hapus Session / Keluar</button>
    </div>
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Session from '@/helpers/session';
import { FbDb } from '@/services/fpdb';
import { Sdk } from '@/services/sdk';
import moment from 'moment';
import { Component, Vue, Prop } from 'vue-property-decorator'
const alertify = require('alertifyjs');

@Component
export default class Header extends Vue {
  @Prop({ required: true }) sekolah!: string;

  private dateToday = '';
  private timeToday = '';
  private dbActive = false;
  private sdkActive = false;

  logout() {
    Session.logout();
    this.$router.replace('/');
    document.title = `APLIKASI ABSENSI ${this.$store.state.version} - OPERATOR SEKOLAH`;
  }

  async created() {
    document.title = `APLIKASI ABSENSI ${this.$store.state.version} - ${this.sekolah}`;
  }

  fetchDateTime() {
    fetch(`http://worldtimeapi.org/api/timezone/Asia/Jakarta`).then(response => response.json()).then(data => {
      const dateApi = moment(data.datetime).format('dddd, DD MMMM YYYY').toUpperCase();
      if (dateApi != this.dateToday) {
        alertify.alert('ERROR', '<strong class="text-danger">TANGGAL KOMPUTER TIDAK VALID!</strong>', function() {
          // do nothing
        });
      }
    });
  }

  checkDb() {
    const fbDb: FbDb = FbDb.getInstance();
    if (fbDb) {
      fbDb.quickCheckConnection().then(() => {
        this.dbActive = true;
        this.$emit('dbActive');
      }).catch(err => {
        console.log(err);
      });
    }
  }

  checkSdk() {
    const sdk: Sdk = Sdk.getInstance();
    if (sdk) {
      sdk.quickCheckConnection().then(() => {
        this.sdkActive = true;
        this.$emit('sdkActive');
        this.checkDb();
      }).catch(() => {
        this.checkDb();
      });
    }
  }

  mounted() {
    this.dateToday = moment().format('dddd, DD MMMM YYYY').toUpperCase();
    this.timeToday = moment().format('HH:mm');
    this.fetchDateTime();
    this.checkSdk();

    setInterval(() => {
      const m = moment();
      this.dateToday = m.format('dddd, DD MMMM YYYY').toUpperCase();
      this.timeToday = m.format('HH:mm');
    }, 1000);
  }
}
</script>

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