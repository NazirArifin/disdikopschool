import { defineStore } from 'pinia';

export const useMainStore = defineStore({
  id: 'main',
  state: () => <{
    spinner: boolean;
    spinMessage: string;
    version: string;
    user: any;
  }>({
    spinner: false,
    spinMessage: '',
    version: '',
    user: {}
  }),

  actions: {
    showSpinner(message: string) {
      this.spinner = true;
      this.spinMessage = message;
    },
    hideSpinner() {
      this.spinner = false;
      this.spinMessage = '';
    },
    changeSpinner(value: boolean) {
      this.spinner = value;
    },
    changeSpinMessage(value: string) {
      this.spinMessage = value;
    },
    changeUser(field: string, value: any) {
      this.user[field] = value;
    },
    resetUser() {
      this.user = {};
    },
    setVersion(value: string) {
      this.version = value;
    }
  }
});