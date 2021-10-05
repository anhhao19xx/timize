<template>
  <div>
    <CommonGadget/>

    <!-- TOP BAR -->
    <div class="app-top-bar">
      <input type="file" class="d-none" @change="importFromFile" id="import-from-file">
      <label for="import-from-file" class="btn btn-none">
        <i class="icon icon-cloud-upload"></i>
      </label>
      <b-button @click="exportToFile" variant="none">
        <i class="icon icon-cloud-download"></i>
      </b-button>
    </div>
    <!-- END TOP BAR -->

    <b-container class="app-container" fluid>
      <!-- SIDEBAR -->
      <div class="app-sidebar">
        <nuxt-link to="/" class="item">
          <i class="icon icon-clock"></i>
          <span class="text">Timeline</span>
        </nuxt-link>
        <nuxt-link to="/tasks" class="item">
          <i class="icon icon-list"></i>
          <span class="text">Tasks</span>
        </nuxt-link>
        <nuxt-link to="/calendar" class="item">
          <i class="icon icon-calendar"></i>
          <span class="text">Calendar</span>
        </nuxt-link>
      </div>
      <!-- END SIDEBAR -->

      <!-- CONTENT -->
      <div class="app-content">
        <Nuxt />
      </div>
      <!-- END CONTENT -->

      <!-- TOOL BOX -->
      <!-- <div class="tool-box">
        This is a tool-box
      </div> -->
      <!-- END TOOL BOX -->

    </b-container>
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

  computed: {
    ...mapState(['data'])
  },

  methods: {
    ...mapMutations(['incDataVer']),

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
    }
  }
}
</script>

<style lang="scss" scoped>
$top-bar-height: 50px;
$border-color: #EAEAEA;
$sidebar-width: 150px;
$tool-box-width: 250px;

.app-top-bar {
  position: fixed;
  z-index: 10;
  width: 100%;

  display: flex;
  align-items: center;
  padding: 0 12px;
  height: $top-bar-height;
  min-height: $top-bar-height;
  background: #FFF;
  border-bottom: 1px solid $border-color;
  margin-bottom: -1px;

  .btn {
    background-color: transparent;
    color: inherit;
    border: none;
    height: 30px;
    line-height: 30px;
    width: 30px;
    text-align: center;
    margin: 0px 12px;
    padding: 0;
    cursor: pointer;
    border-radius: 15px;
    outline: none;
    box-shadow: none;

    .icon {
      font-size: 1.2em;
      transition: all .2s;
    }
  }

  .btn:hover, .btn:active {
    background-color: transparent;
    color: inherit;
    
    .icon {
      font-size: 1.4em;
    }
  }
}

.app-sidebar {
  position: fixed;
  top: $top-bar-height;
  left: 0;
  width: $sidebar-width;
  height: 100%;
  background-color: white;
  border-right: 1px solid $border-color;
  z-index: 10;

  .item {
    display: block;
    height: 40px;
    line-height: 40px;
    padding: 0 .5em;

    .icon {
      margin-left: .5em;
      margin-right: 1em;
    }

    &:hover {
      text-decoration: none;
      background-color: #f0f0f0;
    }
  }
}

.tool-box {
  position: fixed;
  top: $top-bar-height;
  right: 0;
  width: $tool-box-width;
  height: 100%;
  background-color: white;
  border-left: 1px solid $border-color;
  z-index: 10;
}

.app-container {
  padding-top: $top-bar-height;
  padding-left: $sidebar-width;
}

</style>