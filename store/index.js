export const state = () => ({
  isNotice: false,
  notices: [],

  dataVersion: 0
})

export const mutations = {
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

  incDataVer(state){
    state.dataVersion++;
  },
}

export const actions = {}