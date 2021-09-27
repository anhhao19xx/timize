<template>
  <div>
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
        <b-col cols="3">
          
        </b-col>
        <!-- END SIDEBAR -->

        <!-- CONTENT -->
        <b-col cols="9" class="app-content">
          <b-button variant="primary" class="add-piece" @click="addPiece"><big>+</big></b-button>

          <div v-for="item in dataGroupByDate" :key="item.groupValue" class="piece-group">
            <div class="date">{{ formatDate(item.groupValue) }}</div>

            <div v-for="piece in item.list" :key="piece.id" class="piece">
              <div class="time">{{ formatTime(piece.createdAt) }}</div>
              <div class="top-bar">
                <b-button @click="selectPiece(piece)" variant="outline-primary" size="sm">
                  <i class="icon icon-pencil"></i>
                </b-button>
                <b-button @click="removePiece(piece)" variant="outline-danger" size="sm">
                  <i class="icon icon-trash"></i>
                </b-button>
              </div>
              <div class="content md-content" v-html="marked(piece.content)"></div>
            </div>
          </div>

          <b-modal id="current-piece" hide-header hide-footer size="xl" @hide="closeCurrentPieceModal">
            <div v-if="currentPiece">
              <editor v-model="currentPieceContent"></editor>
            </div>
          </b-modal>
        </b-col>
        <!-- END CONTENT -->
      </b-row>
      <!-- END MAIN -->

    </b-container>
  </div>
</template>

<script>
import { nanoid } from 'nanoid';
import moment from 'moment';
import dateFormat from "dateformat";
import editor from '../comps/editor.vue';

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
  components: { editor },
  data(){
    return {
      currentPiece: null,
      currentPieceContent: null,

      state: 'saved',

      data: []
    }
  },

  mounted(){
    const rawData = localStorage.getItem('timize-data');

    if (rawData)
      this.data = JSON.parse(rawData);
    else
      this.data = [];
  },

  computed: {
    dataGroupByDate(){
      const dates = {};
      for (let piece of this.data){
        let pieceDate = moment(piece.createdAt).format('YYYY-MM-DD');

        if (!dates[pieceDate])
          dates[pieceDate] = [];

        dates[pieceDate].push(piece);
      }

      const ls = [];
      for (let pieceDate of Object.keys(dates).sort((a, b) => (a > b ? -1 : 1))){
        ls.push({
          groupBy: 'createdAt',
          groupValue: pieceDate,
          list: dates[pieceDate]
        });
      }

      return ls;
    }
  },

  methods: {
    save(){
      localStorage.setItem('timize-data', JSON.stringify(this.data));

      this.$bvToast.toast(`Saved`, {
        title: 'Timizer',
        autoHideDelay: 3000,
        variant: 'success',
        appendToast: true,
        toaster: 'b-toaster-bottom-right'
      });
    },

    async importFromFile(event){
      const file = event.target.files[0];

      const rawData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(){ resolve(reader.result) }
        reader.readAsText(file);
      });

      this.data = JSON.parse(rawData);
      this.save();

      event.target.value = null;
    },

    exportToFile(){
      download(`timize - ${moment().format('YYYYMMDD HHmmss')}.json`, JSON.stringify(this.data));
    },

    marked(str){
      return this.$md.parse(str);
    },

    formatDate(d){
      return dateFormat(d, 'DDDD');
    },

    formatTime(d){
      return moment(d).format('HH:mm')
    },

    addPiece(){
      const createdAt = new Date();

      this.data.unshift({
        id: nanoid(),
        title: `Quick note at ${moment(createdAt).format('YYYY-MM-DD HH:mm:ss')}`,
        content: '',
        createdAt
      });

      this.save();
    },

    selectPiece(piece){
      this.currentPiece = piece;
      this.currentPieceContent = this.currentPiece.content;

      this.$bvModal.show('current-piece');
    },

    closeCurrentPieceModal(){
      if (this.currentPieceContent === this.currentPiece.content)
        return;

      this.currentPiece.content = this.currentPieceContent;

      this.save();
    },

    removePiece(piece){
      const pos = this.data.indexOf(piece);
      this.data.splice(pos, 1);

      this.save();
    }
  }
}
</script>

<style lang="scss" scoped>
.add-piece {
  width: 40px;
  height: 40px;
  padding: 0;
  text-align: center;
  line-height: 36px;
  margin: 0 auto;
  display: block;
  margin-top: 1em;

  big {
    font-size: 26px;
  }
}

.piece-group {
  margin-top: 1em;
  margin-bottom: 1em;
  
  padding-top: 1em;
  padding-bottom: 1em;
  

  .date {
    font-size: 1.5em;
    font-weight: bold;
  }

  .piece {
    position: relative;
    border: 1px solid #e0e0e0;
    padding: .5em 2.8em .5em 1em;
    margin: 1em 0;
    min-height: 5em;
    border-radius: .5em;
    
    .time {
      position: absolute;
      left: -6em;
      width: 5em;
      text-align: right;
    }

    .top-bar {
      position: absolute;
      top: 0;
      right: 0;

      button {
        display: block;
        margin: .5em;
        font-size: .8em;
      }
    }
  } 

}
</style>