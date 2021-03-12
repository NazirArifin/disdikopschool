<template>
  <div class="row px-4">
    <div class="col-md-4 left-part">
      <h5 class="font-weight-bold mb-0">{{sekolah}}</h5>
      <p class="font-weight-bold">{{dateToday}}<br>{{timeToday}} WIB</p>
    </div>
    <div class="col-md-4 offset-md-4 text-right right-part">
      <button class="btn btn-lg btn-danger shadow-sm py-2" type="button" v-on:click="logout()">Hapus Session / Keluar</button>
    </div>
  </div>
</template>

<script lang="ts">
import Session from '@/helpers/session';
import moment from 'moment';
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class Header extends Vue {
  @Prop({ required: true }) sekolah!: string;

  private dateToday = '';
  private timeToday = '';

  logout() {
    Session.logout();
    this.$router.replace('/');
  }

  mounted() {
    this.dateToday = moment().format('dddd, DD MMMM YYYY').toUpperCase();
    this.timeToday = moment().format('hh:mm').toUpperCase();

    setInterval(() => {
      const m = moment();
      this.dateToday = m.format('dddd, DD MMMM YYYY').toUpperCase();
      this.timeToday = m.format('hh:mm');
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