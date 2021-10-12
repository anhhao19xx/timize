import axios from 'axios';

export default (app) => {
  const { store } = app;

  const createHttpClient = () => {
    const baseURL = app.$config.apiUrl;
    const headers = {};

    const apikey = store.state.apikey;
    if (apikey){
      headers['X-API-Key'] = apikey;
    }

    return axios.create({ baseURL, headers });
  }

  return {
    async post(url, payload){
      const http = createHttpClient();
      const res = await http.post(url, payload);
      return res.data;
    },

    async get(url){
      const http = createHttpClient();
      const res = await http.get(url);
      return res.data;
    },

    async patch(url, payload){
      const http = createHttpClient();
      const res = await http.patch(url, payload);
      return res.data;
    },

    async delete(url){
      const http = createHttpClient();
      const res = await http.delete(url);
      return res.data;
    }
  }
}