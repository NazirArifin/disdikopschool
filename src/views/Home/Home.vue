<template src="@/views/Home/Home.html"></template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, Vue } from 'vue-property-decorator'
import Header from '@/components/Header.vue'
const DatePicker = require('vue2-datepicker').default
import 'vue2-datepicker/locale/id'
import { SyncType, MyDb, PegawaiType } from '@/services/mydb'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const alertify = require('alertifyjs');
import { ValidationProvider, ValidationObserver, extend } from 'vee-validate'
import { required, min, max } from 'vee-validate/dist/rules'
import { initJsStore, conn } from '@/services/idb'
import moment from 'moment'
import Api from '@/helpers/api'
import { ConfigType, Database } from '@/helpers/db'
declare const $: any;

extend('required', required);
extend('min', min);
extend('max', max);

@Component({
  components: {
    Header, DatePicker,
    ValidationProvider, ValidationObserver
  },
  directives: {
    pickFile: {
      inserted: (el: HTMLElement, binding: any, vnode: any) => {
        const $el = $(el);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        $el.on('change', (e: Event) => {
          const count = $el[0].files.length;
          if (count === 0) return;
          const file: File = $el[0].files[0];
          if (file.size > 1 * 1024 * 1024) {
            vnode.context.$toast.error('ERROR: File tidak boleh lebih besar dari 1MB');
          }
          vnode.context.file = file;
        });
      }
    }
  }
})
export default class Home extends Vue {
  private activeMenu = 'sinkron';
  private reportDate = '';
  private sinkronDate = '';
  private empDb: MyDb;
  private syncDb: MyDb;
  private apiService: Api = new Api();

  get sekolah() {
    return this.$store.state.user.sekolah.nama;
  }
  get lastSync() {
    if (this.syncList.length == 0) {
      return '-';
    }
    return moment(this.syncList[0].date).format('dddd, DD MMMM YYYY HH.mm');
  }
  get fileLabel() {
    if (this.file == null) {
      if (this.ajuan.id == 0) return 'Pilih Dokumen';
      else return 'Ganti Dokumen';
    }
    return this.file.name;
  }

  disabledBefore1March(date: Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today || date < new Date(2021, 1, 28, 0, 0, 1);
  }

  private dbConfig: ConfigType;
  async saveSetting() {
    localStorage.removeItem('dbSetting');
    localStorage.setItem('dbSetting', JSON.stringify(this.dbConfig));
    
    await this.empDb.clear();
    Database.close();
    Database.init(this.dbConfig);
    
    this.loadPegawai();
  }

  private checkingConn = false;
  async checkDbConn() {
    this.checkingConn = true;
    try {
      Database.close();
      Database.init(this.dbConfig);

      const v = await Database.query(`SHOW VARIABLES LIKE "version"`);
      const version = v[0].Value;
      const t = await Database.query(`SHOW TABLES`);
      const tables = t.map((row: any) => {
        return row.Tables_in_fpdb;
      }).filter((row: any) => row == 'att_log' || row == 'pegawai');

      alertify.alert('KONEKSI SUKSES', `<strong class="text-success">Versi MySQL: ${version}</strong><br>&bull; Tabel absensi <i class="icon-${tables.indexOf('att_log') != -1 ? 'check' : 'close'}"></i><br>&bull; Tabel pegawai <i class="icon-${tables.indexOf('pegawai') != -1 ? 'check' : 'close'}"></i>`, function() {
        // do nothing
      });
      this.checkingConn = false;
    } catch(err) {
      this.checkingConn = false;
      alertify.alert('ERROR', '<strong class="text-danger">KONEKSI GAGAL</strong>', function() {
        // do nothing
      });
    }
  }

  changeMenu(menu: string) {
    this.activeMenu = menu;
  }

  constructor() {
    super();
    this.empDb = new MyDb(initJsStore, conn, 'Pegawai');
    this.syncDb = new MyDb(initJsStore, conn, 'Sinkron');
    const dbSetting = localStorage.getItem('dbSetting');
    if (dbSetting) {
      this.dbConfig = JSON.parse(dbSetting);
    } else {
      this.dbConfig = {
        host: 'localhost',
        port: '3306',
        user: 'root',
        password: '',
        database: '',
        multipleStatements: true,
        connectionLimit: 3000
      }
      localStorage.setItem('dbSetting', JSON.stringify(this.dbConfig));
    }
    Database.init(this.dbConfig);
  }

  // BAGIAN SYNCRON
  // ----------------------------------------------------------------------------------
  private syncList: readonly SyncType[] = [];
  async loadSyncData() {
    this.syncList = Object.freeze(await this.syncDb.getAll(365));
  }

  private inIdling = false;
  activateIdling() {
    this.inIdling = true;
    setTimeout(() => {
      this.inIdling = false;
    }, 5 * 60 * 1000);
  }

  private userList: readonly { pin: string; name: string }[] = [];
  private logList: readonly { pin: string; dateTime: string }[] = [];
  async syncronize() {
    this.$store.dispatch('showSpinner', 'MENGAMBIL ABSENSI');
    
    // kita cari log di sinkronDate
    const todayTime = moment().format('YYYY-MM-DD HH:mm:ss'); 
    // const today = todayTime.split(' ')[0];
    const today = this.sinkronDate.split('/').reverse().join('-');
    
    const pins: string[] = [];
    const names: string[] = [];
    const aliases: string[] = [];
    const dateTimes: string[] = [];

    try {
      const logs: any[] = await Database.query(`SELECT scan_date, pin FROM att_log WHERE DATE(scan_date) = ? ORDER BY scan_date`, [today]);
      if (logs.length == 0) {
        alertify.alert('ERROR', '<strong class="text-danger">TIDAK ADA DATA ABSENSI HARI INI</strong>', function() {
          // do nothing
        });
        this.$store.dispatch('hideSpinner'); return;
      }
      
      logs.filter((v: any) => {
        const p = this.pegawaiList.find((k: PegawaiType) => k.pin == v.pin);
        return p?.active;
      }).forEach((v: any) => {
        const p = this.pegawaiList.find((k: PegawaiType) => k.pin == v.pin);
        pins.push(p?.nip || '');
        names.push(p?.nama || '');
        aliases.push(p?.namaSingkat || '');
        dateTimes.push(moment(v.scan_date).format('YYYY-MM-DD HH:mm:ss'));
      });
           
      this.$store.dispatch('changeSpinnerMessage', 'MENGIRIM DATA KE SERVER');
      // kirimkan ke server
      this.apiService.postResource('/sinkron', {
        // pin: pins, name: names, alias: aliases, dateTime: dateTimes
        pin: JSON.stringify(pins), name: JSON.stringify(names), alias: JSON.stringify(aliases), dateTime: JSON.stringify(dateTimes)
      }, true).then(async data => {
        this.$store.dispatch('hideSpinner')
        // tambahkan di database
        if (data.success) {
          this.$toast.success(`SUKSES: JUMLAH DATA TERPROSES: ${data.count}`);
          this.activateIdling();
          await this.syncDb.insert({ date: todayTime, count: data.count });
          this.loadSyncData();
        } else {
          this.$toast.error('ERROR: ' + data.message);
        }
      }).catch(err => {
        this.$store.dispatch('hideSpinner');
        this.$toast.error('ERROR: ' + err.data.message);
        this.activateIdling();
      });
    } catch(err) {
      this.$store.dispatch('hideSpinner');
      this.$toast.error(err.toString());
    }
  }

  // BAGIAN DATA PEGAWAI
  // ----------------------------------------------------------------------------------
  /* eslint-disable @typescript-eslint/no-explicit-any */
  private pegawaiList: PegawaiType[] = [];
  async loadPegawai() {
    this.pegawaiList = [];
    try {
      const rows = await Database.query(`SELECT pegawai_pin, pegawai_nip, pegawai_nama, pegawai_alias FROM pegawai`);
      if (rows.length == 0) {
        this.$toast.error('Data pegawai kosong, pastikan sudah di unduh dari mesin fingerprint!');
        return;
      }
      
      const empDb: any[] = rows.map((v: any) => {
        return { pin: v.pegawai_pin, nip: v.pegawai_nip || v.pegawai_pin, nama: v.pegawai_nama, alias: v.pegawai_alias };
      });

      let empIdb: PegawaiType[] = await this.empDb.getAll();
      let change = false;
      if (empDb.length > empIdb.length) {
        for await (const v of empDb) {
          if (empIdb.findIndex((k: any) => k.nip == v.nip) == -1) {
            this.empDb.insert({
              pin: v.pin, nip: v.nip, nama:v.nama, namaSingkat: v.alias, active: true
            });
          }
        }
        change = true;
      }
      if (empIdb.length > empDb.length) {
        for await (const v of empIdb) {
          if (empDb.findIndex((k: any) => k.nip == v.nip) == -1) {
            await this.empDb.delete({ id: v.id });
          }
        }
        change = true;
      }

      if (change) empIdb = await this.empDb.getAll();
      // apakah ada perubahan
      for await (const v of empIdb) {
        const i = empDb.findIndex((k: any) => k.nip == v.nip);
        if (i != -1) {
          const p = empDb[i];
          const o = {};
          if (p.nip != v.nip) Object.assign(o, { nip: p.nip });
          if (p.nama != v.nama) Object.assign(o, { nama: p.nama });
          if (p.alias != v.namaSingkat) Object.assign(o, { namaSingkat: p.alias });
          if (Object.keys(o).length > 0) {
            change = true;
            await this.empDb.update(o, { id: v.id });
          }
        }
      }
      if (change) empIdb = await this.empDb.getAll();
      this.pegawaiList = empIdb;

    } catch(err) {
      this.$toast.error(err.toString());
    }
  }

  updateStatusActive(i: number) {
    const p = this.pegawaiList[i];
    this.empDb.update({ active: p.active }, { id: p.id });
  }

  // BAGIAN PENGAJUAN IJIN
  // ----------------------------------------------------------------------------------
  private ajuan: { id: number; sekolah: string; pegawai: string; jenis: string; alasan: string; keterangan: string; tanggal: string[]|string } = this.presetAjuan();
  private file: File|null = null;
  presetAjuan() {
    return {
      id: 0, sekolah: '', pegawai: '', jenis: '', alasan: '', keterangan: '', tanggal: ['', '']
    };
  }
  resetAjuan() {
    this.ajuan = this.presetAjuan();
    this.file = null;
  }

  private jenisIjinList: { id: number; val: string }[] = [
    { id: 1, val: 'Tidak Masuk' },
    { id: 2, val: 'Datang Terlambat' },
    { id: 3, val: 'Pulang Awal' },
    { id: 4, val: 'Tidak Scan Masuk' },
    { id: 5, val: 'Tidak Scan Pulang' },
  ];
  private ajuanList: any[] = [];
  loadAjuan() {
    this.apiService.getResource('/ijin', { sekolah: this.$store.state.user.sekolah.id }).then(data => {
      this.ajuanList = data;
    }).catch(err => this.$toast.error(err.toString()));
  }
  editAjuan(i: number) {
    const item = this.ajuanList[i];
    this.ajuan.id = item.id;
    this.ajuan.pegawai = item.nip;
    this.ajuan.jenis = item.jenis;

    const f = this.jenisIjinList.find((v: any) => v.id == item.alasan);
    if (f) {
      this.ajuan.alasan = '' + f.id;
    } else {
      this.ajuan.alasan = '5';
    }
    this.ajuan.keterangan = item.alasan;
    
    this.ajuan.tanggal = [item.mulai.split('-').reverse().join('/'), item.akhir.split('-').reverse().join('/')];
  }
  deleteAjuan(i: number) {
    alertify.confirm('Hapus Ajuan', 'Apakah Anda yakin akan data ajuan ijin ini?', async () => {
      const item = this.ajuanList[i];
      this.apiService.deleteResource(`/ijin/ajuan/${item.id}`).then(() => {
        this.loadAjuan();
      }).catch(err => this.$toast.error(err.toString()));
    }, function() {
      // nothing to worry
    })
  }

  saveIjin() {
    this.$store.dispatch('showSpinner', 'MENGIRIM DATA');
    this.ajuan.sekolah = this.$store.state.user.sekolah.id;
    if (Array.isArray(this.ajuan.tanggal)) {
      this.ajuan.tanggal = this.ajuan.tanggal.join(',');
    }
    this.apiService.postResource('/ijin/ajuan', this.ajuan, true, this.file).then(() => {
      this.$store.dispatch('hideSpinner');
      this.$toast.success('Data ajuan berhasil disimpan');
      this.resetAjuan();
      this.loadAjuan();
    }).catch(err => {
      this.$toast.error(err.toString());
      this.$store.dispatch('hideSpinner');
    });
  }

  // BAGIAN LAPORAN
  // ----------------------------------------------------------------------------------
  downloadReport() {
    this.$store.dispatch('showSpinner', 'MEN-GENERATE LAPORAN');
    this.apiService.download('/absensi/harian', {
      institution: this.$store.state.user.sekolah.id,
      start: this.reportDate[0],
      end: this.reportDate[1],
      excel: 3
    }).then(() => {
      // this.isDownloading = false;
      this.$store.dispatch('hideSpinner');
    }).catch(() => {
      // this.isDownloading = false;
    });
  }

  mounted() {
    this.loadPegawai();
    this.loadSyncData();
    this.loadAjuan();
    this.sinkronDate = moment().format('DD/MM/YYYY');
  }
}
</script>

<style lang="scss" scoped src="@/views/Home/Home.scss">