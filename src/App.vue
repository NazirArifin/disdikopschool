<script lang="ts">
declare const Mousetrap: any;
</script>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useMainStore } from './store/main';
import { ipcRenderer } from 'electron';
import { useRoute } from 'vue-router';

const route = useRoute();
const mainStore = useMainStore();
const spinner = computed(() => mainStore.spinner);
const spinMessage = computed(() => mainStore.spinMessage);

function showOfflineNotify() {
  const offlineNotify = document.getElementById('offline-notify');
  if (navigator.onLine) {
    if (! offlineNotify?.classList.contains('hide')) {
      offlineNotify?.classList.add('hide');
    }
  } else {
    if (offlineNotify?.classList.contains('hide')) {
      offlineNotify?.classList.remove('hide');
    }
  }
}

function enableRightClick() {
  Mousetrap.bind('ctrl+d+v+p', () => {
    ipcRenderer.send('enable-dev-tools');
  });
}

onMounted(async () => {
  window.addEventListener('online', showOfflineNotify);
  window.addEventListener('offline', showOfflineNotify);
  enableRightClick();

  const version = await ipcRenderer.invoke('get-version');
  mainStore.setVersion(version);
});
</script>

<template>
  <div id="app">
    <section id="offline-notify" class="shadow notify hide bg-warning p-3 text-white text-center">
      <h3>Anda sedang OFFLINE</h3>
      <div class="notify-content">
        Saat ini Anda terdeteksi tidak memiliki koneksi internet aktif. Periksa jaringan internet Anda
      </div>
    </section>
    <div class="container-fluid pl-0 pr-0">
      <span>
        <router-view :key="route.name!"></router-view>
      </span>
    </div>
    <div class="cover" :class="{ hide: ! spinner }">
      <div class="d-flex flex-column justify-content-center align-items-center">
        <div class="sk-chase">
          <div class="sk-chase-dot"></div>
          <div class="sk-chase-dot"></div>
          <div class="sk-chase-dot"></div>
          <div class="sk-chase-dot"></div>
          <div class="sk-chase-dot"></div>
          <div class="sk-chase-dot"></div>
        </div>
        <p v-if="spinMessage" class="text-white text-center mt-3 font-weight-bold"><small>{{ spinMessage }}</small></p>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
$simple-line-font-path: '../node_modules/simple-line-icons/fonts/';
@import '../node_modules/simple-line-icons/scss/simple-line-icons';
@import '../node_modules/vue-toastification/src/scss/index';
@import '../node_modules/@vuepic/vue-datepicker/src/VueDatePicker/style/main';
:root {
  --dp-font-size: 13px;
  --dp-cell-padding: 0.5rem;
  --dp-border-radius: 0;
}

.Vue-Toastification__toast {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  letter-spacing: 0;
}

#app {
  overflow-x: auto;
  height: 100vh;
  overflow-x: hidden;
}

.sk-chase {
  width: 60px;
  height: 60px;
  animation: sk-chase 2.5s infinite linear both;
}

.sk-chase-dot {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0; 
  animation: sk-chase-dot 2.0s infinite ease-in-out both; 
}

.sk-chase-dot:before {
  content: '';
  display: block;
  width: 25%;
  height: 25%;
  background-color: #fff;
  border-radius: 100%;
  animation: sk-chase-dot-before 2.0s infinite ease-in-out both; 
}

.sk-chase-dot:nth-child(1) { animation-delay: -1.1s; }
.sk-chase-dot:nth-child(2) { animation-delay: -1.0s; }
.sk-chase-dot:nth-child(3) { animation-delay: -0.9s; }
.sk-chase-dot:nth-child(4) { animation-delay: -0.8s; }
.sk-chase-dot:nth-child(5) { animation-delay: -0.7s; }
.sk-chase-dot:nth-child(6) { animation-delay: -0.6s; }
.sk-chase-dot:nth-child(1):before { animation-delay: -1.1s; }
.sk-chase-dot:nth-child(2):before { animation-delay: -1.0s; }
.sk-chase-dot:nth-child(3):before { animation-delay: -0.9s; }
.sk-chase-dot:nth-child(4):before { animation-delay: -0.8s; }
.sk-chase-dot:nth-child(5):before { animation-delay: -0.7s; }
.sk-chase-dot:nth-child(6):before { animation-delay: -0.6s; }

@keyframes sk-chase {
  100% { transform: rotate(360deg); } 
}

@keyframes sk-chase-dot {
  80%, 100% { transform: rotate(360deg); } 
}

@keyframes sk-chase-dot-before {
  50% {
    transform: scale(0.4); 
  } 100%, 0% {
    transform: scale(1.0); 
  } 
}

.notify {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  opacity: .8;
  &.hide {
    display: none;
  }
}

.cover {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 9000;
  display: flex;
  justify-content: center;
  align-items: center;
}
.cover.hide {
  display: none;
}

::-webkit-scrollbar { 
  width: 5px;
  height: 5px; 
}
::-webkit-scrollbar-track { 
  box-shadow: inset 0 0 6px rgba(0,0,0,0.3); 
  border-radius: 0px;
  background-color: rgba(0,0,0,.1);
}
::-webkit-scrollbar-thumb {
  border-radius: 0px;
  box-shadow: inset 0 0 6px rgba(0,0,0,0.5); 
}

.IZ-select__input input {
  font-size: .9375rem !important;
}
</style>
