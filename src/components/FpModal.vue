<script lang="ts">
declare const alertify: any;
</script>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { SdkConfigType } from '../helpers/types';
import { ipcRenderer } from 'electron';
import { PoolOptions } from 'mysql2';
import Sdk from '../services/sdk';
import MyDb from '../services/mydb';
import { initJsStore, conn } from '../services/idb';
import { useToast } from 'vue-toastification';

const emits = defineEmits(['syncronPegawai']);

const toast = useToast();
const checkingConn = ref(false);
const activeSetting = ref('sdk');
function setActiveSetting(setting: string) {
  if (setting != activeSetting.value) {
    activeSetting.value = setting;
  }
}

const sdkConfig = reactive<SdkConfigType>({
  instpath: '', ipmac: '', portmac: '5005', snmac: '', 
  passwordmac: '0', numbermac: '1', activationmac: '',
  iphost: '', porthost: ''
});
const dbConfig = reactive<PoolOptions>({
  host: 'localhost', port: 3306, user: 'root',
  password: '', database: '', multipleStatements: true,
  connectionLimit: 10, 
  // bigIntAsNumber: true
});
const sdk = Sdk.getInstance();
const empDb = new MyDb(initJsStore, conn, 'Pegawai');

async function saveSetting() {
  await empDb.clear();
  if (activeSetting.value == 'db') {
    ipcRenderer.invoke('db-change-setting', { ...dbConfig });
  } else {
    try {
      await sdk.changeSetting({ ...sdkConfig });
    } catch(err: any) {
      toast.error(err.toString());
    }
  }
  // syncronPegawai();
  emits('syncronPegawai');
}

async function checkDbConn() {
  checkingConn.value = true;
  if (activeSetting.value == 'db') {
    try {
      const data = await ipcRenderer.invoke('db-check', { ...dbConfig });
      alertify.alert('KONEKSI SUKSES', `<strong class="text-success">Versi MySQL: ${data.version}</strong><br>&bull; Tabel absensi <i class="icon-${data.tabelAbsensi != -1 ? 'check' : 'close'}"></i><br>&bull; Tabel pegawai <i class="icon-${data.tabelPegawai != -1 ? 'check' : 'close'}"></i>`, function() {
        emits('syncronPegawai');
      });
    } catch (error) {
      alertify.alert('ERROR', '<strong class="text-danger">KONEKSI GAGAL</strong>', function() {
        // do nothing
      });
    } finally {
      checkingConn.value = false;
    }
  } else {
    try {
      await sdk.quickCheckConnection();
      alertify.alert('KONEKSI SUKSES', '<strong class="text-success">KONEKSI SUKSES</strong>', function() {
        emits('syncronPegawai');
      });
    } catch (error) {
      alertify.alert('ERROR', '<strong class="text-danger">KONEKSI GAGAL</strong>', function() {
        // do nothing
      });
    } finally {
      checkingConn.value = false;
    }
  }
}

onMounted(() => {
  // get sdk config from localStorage
  const sdkConfigStr = localStorage.getItem('sdkSetting');
  if (sdkConfigStr) {
    const sdkConfigObj = JSON.parse(sdkConfigStr);
    Object.assign(sdkConfig, sdkConfigObj);
  }
  // sdk.value = Sdk.getInstance();

  // get db config
  const dbConfigStr = localStorage.getItem('dbSetting');
  if (dbConfigStr) {
    const dbConfigObj = JSON.parse(dbConfigStr);
    Object.assign(dbConfig, dbConfigObj);
  }
});
</script>

<template>
  <!-- MODAL EDIT / TAMBAH PERANGKAT -->
  <div class="modal fade" id="fp-modal" data-backdrop="static" data-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Pengaturan</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <ul class="nav nav-tabs" id="settingTab" role="tablist">
            <li class="nav-item">
              <a href="#sdkTab" class="nav-link active" data-toggle="tab" role="tab" @click="setActiveSetting('sdk')">Koneksi SDK</a>
            </li>
            <li class="nav-item">
              <a href="#dbTab" class="nav-link" data-toggle="tab" role="tab" @click="setActiveSetting('db')">Koneksi DB</a>
            </li>
          </ul>
          <div class="tab-content pt-3" id="settingTabContent">
            <div class="tab-pane fade show active" role="tabpanel" id="sdkTab">
              <form role="form" name="formSDK">
                <p class="alert alert-warning shadow-sm p-1"><small>Pastikan SDK sudah terinstall di komputer ini. Hubungi koordinator wilayah untuk memasang SDK</small></p>
                <div class="form-group">
                  <label for="pathd">Path Instalasi SDK*</label>
                  <input type="text" name="path" id="pathd" class="form-control" minlength="4" maxlength="60" required v-model="sdkConfig.instpath" placeholder="Path Instalasi" :disabled="checkingConn">
                  <small class="form-text text-muted">
                    (*) Install SDK di <strong>selain folder Program Files</strong> agar aplikasi memiliki akses untuk menulis file pengaturan di folder instalasi SDK
                  </small>
                </div>
                <div class="form-group">
                  <label for="hostd">IP Host (Komputer)</label>
                  <input type="text" name="host" id="hostd" class="form-control" minlength="4" maxlength="40" required v-model="sdkConfig.iphost" placeholder="IP Host" :disabled="checkingConn">
                </div>
                <div class="form-group">
                  <label for="portd">Port Host</label>
                  <input type="text" name="port" id="portd" class="form-control" minlength="2" maxlength="5" required v-model="sdkConfig.porthost" placeholder="Port Host" :disabled="checkingConn">
                </div>
                <div class="form-group">
                  <label for="ipmacd">IP Mesin FP</label>
                  <input type="text" name="ipmac" id="ipmacd" class="form-control" minlength="4" maxlength="40" required v-model="sdkConfig.ipmac" placeholder="IP Mesin" :disabled="checkingConn">
                </div>
                <div class="form-group">
                  <label for="portmacd">Port Mesin</label>
                  <input type="text" name="portmac" id="portmacd" class="form-control" minlength="2" maxlength="5" required v-model="sdkConfig.portmac" placeholder="Port Mesin" :disabled="checkingConn">
                </div>
                <div class="form-group">
                  <label for="snd">SN Mesin</label>
                  <input type="text" name="sn" id="snd" class="form-control" minlength="4" maxlength="40" required v-model="sdkConfig.snmac" placeholder="SN Mesin" :disabled="checkingConn">
                </div>
                <div class="form-group">
                  <label for="actived">Activation Mesin</label>
                  <input type="text" name="active" id="actived" class="form-control" minlength="4" maxlength="60" required v-model="sdkConfig.activationmac" placeholder="Activation Mesin" :disabled="checkingConn">
                </div>
              </form>
            </div>
            <div class="tab-pane fade" role="tabpanel" id="dbTab">
              <form role="form" name="formFP">
                <p class="alert alert-warning shadow-sm p-1"><small>Pastikan database yang dimasukkan adalah yang digunakan oleh aplikasi Fingerspot Personel</small></p>
                <div class="form-group">
                  <label for="host">HOST</label>
                  <input type="text" name="host" id="host" class="form-control" minlength="4" maxlength="40" required v-model="dbConfig.host" placeholder="Nama Host" :disabled="checkingConn">
                </div>
                <div class="form-group">
                  <label for="port">PORT</label>
                  <input type="text" name="port" id="port" class="form-control" minlength="2" maxlength="5" required v-model="dbConfig.port" placeholder="Port Database" :disabled="checkingConn">
                </div>
                <div class="form-group">
                  <label for="database">Nama Database</label>
                  <input type="text" name="database" id="database" class="form-control" minlength="2" maxlength="40" required v-model="dbConfig.database" placeholder="Nama Database" :disabled="checkingConn">
                </div>
                <div class="form-group">
                  <label for="user">User Database</label>
                  <input type="text" name="user" id="user" class="form-control" minlength="2" maxlength="40" required v-model="dbConfig.user" placeholder="User Database" :disabled="checkingConn">
                </div>
                <div class="form-group">
                  <label for="password">Password Database</label>
                  <input type="text" name="password" id="password" class="form-control" minlength="2" maxlength="40" v-model="dbConfig.password" placeholder="Password Database" :disabled="checkingConn">
                </div>
              </form>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal" :disabled="checkingConn">Batal / Tutup</button>
          <button type="button" class="btn btn-warning" @click="checkDbConn()" :disabled="checkingConn">
            <span v-if="checkingConn"><i class="icon-clock"></i> </span> Tes Koneksi
          </button>
          <button type="button" data-dismiss="modal" class="btn btn-primary shadow-sm" v-on:click="saveSetting()" :disabled="checkingConn">Simpan Pengaturan</button>
        </div>
      </div>
    </div>
  </div>
</template>