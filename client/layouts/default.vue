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

    <b-container fluid>
      <!-- MAIN -->
      <b-row>
        <!-- SIDEBAR -->
        <b-col cols="3" class="app-sidebar">
          <b-list-group>
            <b-list-group-item to="/">Timeline</b-list-group-item>
            <b-list-group-item to="/tasks">Tasks</b-list-group-item>
          </b-list-group>
        </b-col>
        <!-- END SIDEBAR -->

        <!-- CONTENT -->
        <b-col cols="9" class="app-content">
          <Nuxt />
        </b-col>
        <!-- END CONTENT -->
      </b-row>
      <!-- END MAIN -->

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
.app-top-bar {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 50px;
  min-height: 50px;
  background: #FFF;
  border-bottom: 1px solid #EFF1F4;
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
  margin-top: 1em;
}
</style>