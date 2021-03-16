<template>
  <div id="app">
    <div class="container-fluid pl-0 pr-0">
      <span v-showRightClick>
        <router-view/>
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
        <p v-if="spinMessage" class="text-white text-center mt-3 font-weight-bold"><small>{{spinMessage}}</small></p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { remote } from 'electron';
import { Component, Vue } from 'vue-property-decorator'

@Component({
  directives: {
    showRightClick: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      bind: (_el: Element, _binding: any) => {
        const isDevelopment = process.env.NODE_ENV !== 'production';
        if (isDevelopment) {
          const { Menu, MenuItem } = remote;
          let rightClickPosition: { x: number; y: number } = { x: 0, y: 0 };
          const menu = new Menu();
          const menuItem = new MenuItem({ label: 'Inspect Element', click: () => {
            remote.getCurrentWindow().webContents.inspectElement(rightClickPosition.x, rightClickPosition.y);
          }})
          menu.append(menuItem);
          window.addEventListener('contextmenu', e => {
            e.preventDefault();
            rightClickPosition = { x: e.x, y: e.y };
            menu.popup();
          }, false);
        }
      }
    }
  }
})
export default class App extends Vue {
  get spinner() {
    return this.$store.state.spinner;
  }
  get spinMessage() {
    return this.$store.state.spinMessage;
  }
}
</script>

<style lang="scss">
$simple-line-font-path: '~simple-line-icons/fonts/';
@import '~simple-line-icons/scss/simple-line-icons';
@import "~vue2-datepicker/scss/index.scss";
@import "~vue-toastification/dist/index.css";
@import "~alertifyjs/build/css/alertify.min.css";
@import "~alertifyjs/build/css/themes/default.min.css";
@import '~vue-cool-select/dist/themes/bootstrap.css';

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