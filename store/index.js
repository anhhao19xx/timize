export const state = () => ({
  // auth
  apikey: null,

  // loader
  numLoader: 0,

  // notice
  isNotice: false,
  notices: [],

  dataVersion: 0
})

export const mutations = {
  // token
  setApiKey(state, value){
    state.apikey = value;

    if (!value){
      localStorage.removeItem('apikey');
    } else
      localStorage.setItem('apikey', value);
  },

  loadApiKey(state){
    state.apikey = localStorage.getItem('apikey');
  },

  // notice
  pushNotice(state, payload){
    state.isNotice = true;
    state.notices.push(payload);
  },

  shiftNotice(state){
    if (!state.notices.length){
      return null;
    }

    return state.notices.shift();
  },

  setIsNotice(state, value){
    state.isNotice = value;
  },

  // loader
  incLoader(state){
    state.numLoader++;
  },

  decLoader(state){
    state.numLoader--;
  },

  // info
  setInfo(state, data){
    state.info = data;
  },

  incDataVer(state){
    state.dataVersion++;
  },
}

export const actions = {}