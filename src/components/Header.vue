<template>
  <div class="row px-4">
    <div class="col-md-4 left-part">
      <h5 class="font-weight-bold mb-0">{{sekolah}}</h5>
      <p class="font-weight-bold">{{dateToday}}<br>{{timeToday}} WIB</p>
    </div>
    <div class="col-md-4 offset-md-4 text-right right-part">
      <button v-if="sekolah != 'KOORDINATOR KECAMATAN'" type="button" class="btn btn-outline-info py-2 mr-2" title="setting database" data-toggle="modal" data-target="#fp-modal"><i class="icon-settings"></i></button>
      <button class="btn btn-lg btn-danger shadow-sm py-2" type="button" v-on:click="logout()">Hapus Session / Keluar</button>
    </div>
  </div>
</template>

<script lang="ts">
import { Database } from '@/helpers/db';
import Session from '@/helpers/session';
import moment from 'moment';
import { Component, Vue, Prop } from 'vue-property-decorator'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const alertify = require('alertifyjs');

@Component
export default class Header extends Vue {
  @Prop({ required: true }) sekolah!: string;

  private dateToday = '';
  private timeToday = '';

  logout() {
    Session.logout();
    this.$router.replace('/');
    Database.close();
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

  mounted() {
    this.dateToday = moment().format('dddd, DD MMMM YYYY').toUpperCase();
    this.timeToday = moment().format('HH:mm');
    this.fetchDateTime(); 

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