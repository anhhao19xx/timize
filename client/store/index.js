export const state = () => ({
  isNotice: false,
  notices: [],

  data: []
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

  // data
  loadData(state) {
    const rawData = localStorage.getItem('timize-data');

    if (rawData)
      state.data = JSON.parse(rawData);
    else
      state.data = [];
  },

  saveData(state, data){
    if (data)
      state.data = data;
    
    localStorage.setItem('timize-data', JSON.stringify(state.data));
  },

  addPiece(state, piece){
    state.data.unshift(piece);
  },

  removePiece(state, id){
    for (let i = 0; i < state.data.length; i++){
      if (state.data[i].id === id){
        state.data.splice(i, 1);
        return;
      }
    }
  },

  updatePiece(state, updatedPiece){
    for (let i = 0; i < state.data.length; i++){
      if (state.data[i].id !== updatedPiece.id)
        continue;

      for (let key in updatedPiece)
        if (key !== 'id')
          state.data[i][key] = updatedPiece[key];

      return;
    }
  }
}

export const actions = {
  save({ commit }, data){
    commit('saveData', data);
    commit('pushNotice', { text: 'Saved', type: 'success' });
  },

  add({ commit }, piece){
    commit('addPiece', piece)
    commit('saveData');
    commit('pushNotice', { text: 'Saved', type: 'success' });
  },
  
  remove({ commit }, id){
    commit('removePiece', id);
    commit('saveData');
    commit('pushNotice', { text: 'Saved', type: 'success' });
  },

  update({ commit }, piece){
    commit('updatePiece', piece);
    commit('saveData');
    commit('pushNotice', { text: 'Saved', type: 'success' });
  }
}