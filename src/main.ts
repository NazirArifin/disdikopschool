import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import moment from 'moment';

import Toast from 'vue-toastification';
moment.locale('id');

Vue.use(Toast);

// Format tanggal dengan moment
Vue.filter('formatdate', function(value: string, format: string) {
  if ( ! value) return '';
  return moment(value).format(format);
});

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
