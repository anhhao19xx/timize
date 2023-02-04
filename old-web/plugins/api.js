export default (app, http) => {
  const { store } = app;

  const pushError = message => {
    store.commit('pushNotice', { text: message, type: 'danger' });
  }

  const pushSuccess = message => {
    store.commit('pushNotice', { text: message, type: 'success' });
  }

  const handleError = err => {
    if (!err.response){
      console.error(err);
      return;
    }

    if (err.response.status === 404){
      return null;
    }

    if (err.response && err.response.data && err.response.data.error){
      pushError(err.response.data.error);
      return;
    }

    pushError(err.message);
  }

  return {
    async info(){
      store.commit('incLoader');

      try {
        const data = await http.get('/api');

        store.commit('setInfo', data);
        store.commit('decLoader');
        return data;
      } catch(err){
        handleError(err);
      }

      store.commit('decLoader');
      return null;
    },

    async save(data){
      if (!store.state.info || !store.state.info.user)
        return false;

      const user = store.state.info.user;
      
      let { data: { 0: box }} = await http.get(`/api/boxes?user=${user._id}`);

      if (!box){
        box = await http.post('/api/boxes', {
          user: user._id
        });
      }

      await http.patch(`/api/boxes/${box._id}`, { content: data });

      return true;
    },

    async load(){
      if (!store.state.info || !store.state.info.user)
        return false;

      const user = store.state.info.user;
      
      let { data: { 0: box }} = await http.get(`/api/boxes?user=${user._id}`);

      if (!box){
        box = await http.post('/api/boxes', {
          user: user._id
        });
      }

      return box.content;
    },

    async share(piece){
      // console.log(store.state)
      // await http.post(`/api/shares`, {
      //   box: 
      // })
    }
  }
}