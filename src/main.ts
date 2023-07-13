import { createApp } from 'vue'
import App from './App.vue'
import router from './routes';
import { createPinia } from 'pinia';
import Toast, { POSITION, PluginOptions } from 'vue-toastification';
import dotenv from 'dotenv';

dotenv.config();

createApp(App)
  .use(router)
  .use(createPinia())
  .use(Toast as any, {
    position: POSITION.TOP_RIGHT
  } as PluginOptions)
  .mount('#app').$nextTick(() => postMessage({ payload: 'removeLoading' }, '*'))
