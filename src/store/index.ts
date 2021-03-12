import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    spinner: false,
    user: {}
  },
  mutations: {
    changeSpinner(state, payload) {
      state.spinner = payload;
    },
    changeUser(state, payload) {
      Vue.set(state.user, payload.field, payload.value);
    },
    resetUser(state) {
      state.user = {};
    }
  },
  actions: {
    showSpinner(context) {
      context.commit('changeSpinner', true);
    },
    hideSpinner(context) {
      context.commit('changeSpinner', false);
    }
  },
  modules: {
  }
})
