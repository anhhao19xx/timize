<template>
  <m-default-layout
    :menuItems="menuItems"
  >
    <template v-slot:topbar>
      <input type="file" class="hidden" @change="importFromFile" id="import-from-file">
      <label for="import-from-file" class="p-3 w-12 inline-block text-center cursor-pointer">
        <ion-icon name="cloud-upload-outline"></ion-icon>
      </label>

      <button @click="exportToFile" class="p-3 w-12 inline-block text-center cursor-pointer">
        <ion-icon name="cloud-download-outline"></ion-icon>
      </button>

    </template>

    <Nuxt />
  </m-default-layout>
</template>

<script>
import moment from 'moment';
import { mapMutations, mapActions, mapState } from 'vuex';

import CommonGadget from '../comps/CommonGadget.vue';

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export default {
  components: { CommonGadget },

  data(){
    return {
      currentTheme: null,
      formApiKey: null,
      searchText: ''
    }
  },

  computed: {
    ...mapState(['data', 'apikey']),

    menuItems(){
      return [
        { label: 'Timeline', icon: 'time', type: 'link', href: '/' },
        { label: 'Tasks', icon: 'list', type: 'link', href: '/tasks' },
        { label: 'Calendar', icon: 'calendar', type: 'link', href: '/calendar' },
        { label: 'Relationship', icon: 'link', type: 'link', href: '/relationship' },
        { label: 'Divider 1', icon: 'money', type: 'divider' },
        { label: 'Finance', icon: 'diamond', type: 'link', href: '/finance' },
      ]
    }
  },

  methods: {
    ...mapMutations(['incDataVer', 'setApiKey', 'loadInfo', 'loadApiKey', 'pushNotice', 'setSearchText']),

    async importFromFile(event){
      const file = event.target.files[0];

      const jsonString = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(){ resolve(reader.result) }
        reader.readAsText(file);
      });

      await this.$db.importDB(jsonString);
      location.reload();
    },

    async exportToFile(){
      download(`timize - ${moment().format('YYYYMMDD HHmmss')}.json`, await this.$db.exportDB());
      
      this.$store.commit('pushNotice', { text: 'Exported', type: 'success' });
    },

    setTheme(type){
      this.currentTheme = type;
      localStorage.setItem('theme', this.currentTheme)
      document.body.setAttribute('theme', this.currentTheme);
    },

    checkActive(path){
      return this.$route.path === path;
    },

    async saveApiKey(){
      this.setApiKey(this.formApiKey);
      await this.loadData();
      if (this.apikey){
        this.pushNotice({ type: 'success', text: 'Imported Api Key'});
      } else {
        this.pushNotice({ type: 'danger', text: 'Invalid Api Key'});
      }
      
    },

    async clearApiKey(){
      this.setApiKey(null);
      this.formApiKey = '';
      this.pushNotice({ type: 'success', text: 'Cleared'});
    },

    async loadData(){
      try {
        const { app, user } = await this.$api.info();
        if (!user){
          this.setApiKey(null);
          return;
        }
      } catch(err){
        this.setApiKey(null);
        return;
      }
    },

    async loadCloudData(){
      const confirm = await this.$bvModal.msgBoxConfirm('Are you sure?');
      if (!confirm)
        return;

      const data = await this.$api.load();
      await this.$db.importDB(data);

      this.incDataVer();

      this.$store.commit('pushNotice', { text: 'Loaded', type: 'success' });
    },

    async saveCloudData(){
      const confirm = await this.$bvModal.msgBoxConfirm('Are you sure?');
      if (!confirm)
        return;

      if (await this.$api.save(await this.$db.exportDB())){
        this.$store.commit('pushNotice', { text: 'Saved', type: 'success' });
      } else {
        this.$store.commit('pushNotice', { text: 'Something wrong', type: 'success' });
      }
    },

    makeSearch(){
      this.setSearchText(this.searchText);
    }
  },

  async mounted(){
    // apikey
    // this.loadApiKey();
    // await this.loadData();

    // if (this.apikey)
    //   this.formApiKey = this.apikey;

    // theme
    this.$nextTick(() => {
      this.setTheme(localStorage.getItem('theme') || 'light');
    });
  },
}
</script>
