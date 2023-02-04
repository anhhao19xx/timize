import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', () => {
  let token;

  const init = () => {
    token = localStorage.getItem('token');
  };

  return { init };
});
