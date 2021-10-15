<template>
  <div class="m-app">
    <CommonGadget/>

    <!-- UI CONTROLS -->
    <input type="checkbox" class="m-ui-control" id="op-menubar">
    <input type="checkbox" class="m-ui-control" id="op-sidebar">
    <!-- END UI CONTROLS -->

    <!-- TOPBAR -->
    <div class="m-topbar">
      <label class="m-button" for="op-menubar">
        <i class="icon icon-menu"></i>
      </label>

      <input type="file" class="d-none" @change="importFromFile" id="import-from-file">
      <label for="import-from-file" class="m-button">
        <i class="icon icon-cloud-upload"></i>
      </label>

      <button @click="exportToFile" class="m-button">
        <i class="icon icon-cloud-download"></i>
      </button>

      <input type="text" class="m-input fill">

      <label class="m-button" for="op-sidebar">
        <i class="icon icon-settings"></i>
      </label>
    </div>
    <!-- END TOPBAR -->

    <!-- MENUBAR -->
    <div class="m-menubar">
      <nuxt-link to="/" class="m-button" :active="checkActive('/')">
        <span class="icon-wrapper">
          <i class="icon icon-clock"></i>
        </span>
        <span class="m-menu-label">Timeline</span>
      </nuxt-link>

      <nuxt-link to="/tasks" class="m-button" :active="checkActive('/tasks')">
        <span class="icon-wrapper">
          <i class="icon icon-list"></i>
        </span>
        <span class="m-menu-label">Tasks</span>
      </nuxt-link>

      <nuxt-link to="/calendar" class="m-button" :active="checkActive('/calendar')">
        <span class="icon-wrapper">
          <i class="icon icon-calendar"></i>
        </span>
        <span class="m-menu-label">Calendar</span>
      </nuxt-link>
    </div>
    <!-- END MENUBAR -->

    <!-- SIDEBAR -->
    <div class="m-sidebar">
      <!-- THEME SWITCH -->
      <div class="m-theme-switch m-widget">
        <label for="">Theme</label>
        <button class="m-button dark" @click="setTheme('dark')" :active="currentTheme === 'dark'">Dark</button>
        <button class="m-button light" @click="setTheme('light')" :active="currentTheme === 'light'">Light</button>
      </div>
      <!-- END THEME SWITCH -->

      <!-- API KEY -->
      <div class="m-widget">
        <label for="">Api Key</label>
        <b-form-input class="mb-2" v-model="formApiKey" v-if="!apikey"></b-form-input>
        <b-button variant="primary" size="sm" @click="saveApiKey" v-if="!apikey">Save</b-button>
        <b-button variant="primary" size="sm" @click="clearApiKey" v-if="apikey">Clear</b-button>
      </div>
      <!-- END API KEY -->

      <!-- SYNC -->
      <div class="m-widget" v-if="apikey">
        <label for="">Sync</label>
        <b-button variant="primary" size="sm" @click="loadCloudData">Load</b-button>
        <b-button variant="primary" size="sm" @click="saveCloudData">Save</b-button>
      </div>
      <!-- END SYNC -->
    </div>
    <!-- END SIDEBAR -->

    <!-- CONTENT -->
    <div class="m-content">
      <Nuxt />
    </div>
    <!-- END CONTENT -->
  </div>
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
      formApiKey: null
    }
  },

  computed: {
    ...mapState(['data', 'apikey'])
  },

  methods: {
    ...mapMutations(['incDataVer', 'setApiKey', 'loadInfo', 'loadApiKey', 'pushNotice']),

    async importFromFile(event){
      const file = event.target.files[0];

      const jsonString = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(){ resolve(reader.result) }
        reader.readAsText(file);
      });

      await this.$db.importDB(jsonString);
      event.target.value = null;

      this.incDataVer();

      this.$store.commit('pushNotice', { text: 'Imported', type: 'success' });
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
    }
  },

  async mounted(){
    this.loadApiKey();
    await this.loadData();

    if (this.apikey)
      this.formApiKey = this.apikey;

    this.$nextTick(() => {
      this.setTheme(localStorage.getItem('theme') || 'light');
    });
  },
}
</script>

<style lang="scss" scoped>
@use "sass:math";
@use "sass:color";

@import '@/assets/scss/constants.scss';

$top-bar-height: 50px;
$top-bar-padding: 10px;

.m-app {
  $control-size: $top-bar-height - $top-bar-padding * 2;

  .m-ui-control {
    display: none;
  }

  .m-topbar,
  .m-menubar,
  .m-sidebar {
    background-color: var(--secondary-bg);
    position: fixed;
    z-index: 100;
  }

  .m-topbar {
    width: 100%;
    height: $top-bar-height;
    padding: $top-bar-padding ($top-bar-padding / 2);
    
    border-bottom: 1px solid var(--border);
    display: flex;
    
    .m-button {
      width: $control-size;
      height: $control-size;
      line-height: $control-size * 1.05;
      padding: 0;
      margin: 0 ($top-bar-padding / 2);
      font-size: inherit;
      color: var(--primary);

      display: block;
      background-color: transparent;
      border: none;
      text-align: center;
      cursor: pointer;
      border-radius: $radius;
      font-family: inherit;
      text-decoration: none;

      transition: all .1s;
    }

    .m-button:hover {
      font-size: 1.2em;
    }

    .m-input {
      padding: 0;
      margin: 0 ($top-bar-padding / 2);

      min-width: 10px;
      height: $control-size;
      line-height: $control-size;
      font-size: .85em;

      display: block;
      background-color: var(--primary-bg);
      border: none;
      padding: 0 ($control-size / 2);
      border-radius: $control-size / 2;
      font-family: inherit;

      transition: all .1s;
    }

    .m-input:hover,
    .m-input:active,
    .m-input:focus {
      outline: none;
      background-color: var(--primary-bg);
    }

    .fill {
      flex-grow: 1;
    }
  }

  .m-menubar,
  .m-sidebar {
    top: $top-bar-height;
    transition: all .2s;
    height: 100%;
  }

  .m-menubar {
    left: 0;
    width: $top-bar-height;
    padding: 0 ($top-bar-padding / 2);

    border-right: 1px solid var(--border);

    .m-button {
      padding: $top-bar-padding / 2;
      margin: ($top-bar-padding / 2) 0;
      position: relative;
      overflow: hidden;

      width: 100%;
      display: block;
      text-decoration: none;
      color: var(--primary);
      border-radius: $radius;
      cursor: pointer;

      white-space: nowrap;

      transition: all .1s;

      .icon-wrapper {
        width: $control-size;
        height: $control-size;
        line-height: $control-size;
        display: inline-block;
        text-align: center;
      }
    }

    .m-button:hover,
    .m-button[active] {
      background-color: var(--primary-bg);
    }

    .divider {
      width: 100%;
      height: 1px;
      background-color: var(--border);
      max-width: 80%;
      margin: 0 auto;
    }
  }

  #op-menubar:checked~.m-menubar {
    width: $top-bar-height * 5;
  }

  #op-menubar:not(:checked)~.m-menubar {
    .m-button:hover {
      overflow: visible;

      .m-menu-label {
        position: absolute;
        background-color: var(--secondary-bg);
        left: $control-size + $top-bar-padding * 3;
        border: 1px solid var(--border);
        padding: 0 $top-bar-padding;
        top: 0;
        height: $control-size + $top-bar-padding;
        line-height: $control-size + $top-bar-padding;
        border-radius: $radius;
      }

      .m-menu-label:before {
        content: ' ';
        width: $control-size / 2;
        height: $control-size / 2;
        display: block;
        position: absolute;
        left: - $control-size / 30 * 8;
        top: $control-size / 30 * 11;
        transform: rotate(45deg);
        background-color: var(--secondary-bg);
        border-left: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
      }
    }
  }

  .m-sidebar {
    width: $top-bar-height * 5;
    right: -$top-bar-height * 5;
    border-left: 1px solid var(--border);

    .m-widget {
      padding: $top-bar-padding;

      label {
        font-size: .8em;
        display: block;
        width: 100%;
        text-transform: uppercase;
      }
    }

    .m-theme-switch {
      overflow: hidden;

      .m-button {
        width: 50%;
        line-height: $control-size;
        display: block;
        border: none;
        float: left;
        border: 3px solid transparent;

        &.light {
          background-color: var(--light);
          color: --var('dark');
        }

        &.dark {
          background-color: var(--dark);
          color: var(--light);
        }

        &[active] {
          border: 3px solid lightgreen;
        }
      }
    }
  }

  #op-sidebar:checked~.m-sidebar {
    right: 0;
  }

  .m-content {
    padding-top: $top-bar-height;
    padding-left: $top-bar-height;
  }
}
</style>