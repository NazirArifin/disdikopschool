import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    spinner: false,
    spinMessage: '',
    user: {}
  },
  mutations: {
    changeSpinner(state, payload) {
      state.spinner = payload;
      if (payload) {
        state.spinMessage = '';
      }
    },
    changeSpinnerMessage(state, payload) {
      state.spinMessage = payload;
    },
    changeUser(state, payload) {
      Vue.set(state.user, payload.field, payload.value);
    },
    resetUser(state) {
      state.user = {};
    }
  },
  actions: {
    showSpinner({ commit }, payload) {
      commit('changeSpinner', true);
      if (payload) {
        commit('changeSpinnerMessage', payload);
      }
    },
    hideSpinner({ commit }) {
      commit('changeSpinner', false);
    },
    changeSpinnerMessage({ commit }, payload) {
      commit('changeSpinnerMessage', payload);
    }
  },
  modules: {
  }
})
