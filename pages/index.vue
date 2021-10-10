<template>
  <div class="timeline">
    <b-button variant="primary" class="add-piece" @click="addPiece"><big>+</big></b-button>

    <div v-for="item in dataGroupByDate" :key="item.groupValue" class="piece-group">
      <DateFormat :date="item.groupValue"></DateFormat>

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
        <MdViewer class="content" :value="piece.content" @change="updatePieceContent(piece, $event)"></MdViewer>
      </div>
    </div>

    <Piece v-model="currentPiece"/>
  </div>
</template>

<script>
import { mapState, mapActions, mapMutations } from 'vuex';
import moment from 'moment';
import dateFormat from "dateformat";
import TimizeEditor from '../comps/TimizeEditor.vue';
import DateFormat from '../comps/DateFormat.vue';
import Piece from '../comps/Piece.vue';
import MdViewer from '../comps/MdViewer.vue';

export default {
  components: { TimizeEditor, DateFormat, Piece, MdViewer },

  data(){
    return {
      data: [],

      currentPiece: null,
      currentPieceContent: null
    }
  },

  computed: {
    ...mapState(['dataVersion']), 

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
    ...mapMutations(['updateTasks', 'pushNotice']),

    formatTime(d){
      return moment(d).format('HH:mm')
    },

    async syncData(){
      this.data = await this.$db.list('pieces', { $limit: -1, $sort: { createdAt: -1 } });
    },

    async addPiece(){
      const createdAt = new Date();

      await this.$db.create('pieces', {
        title: `Quick note at ${moment(createdAt).format('YYYY-MM-DD HH:mm:ss')}`,
        content: '',
        createdAt: createdAt.toString(),
        updatedAt: createdAt.toString()
      });

      this.pushNotice({ text: 'Created', type: 'success' });

      await this.syncData();
    },

    selectPiece(piece){
      this.currentPiece = piece.id;
    },

    async removePiece(piece){
      await this.$db.removeWhere('tasks', { piece: piece.id });
      await this.$db.remove('pieces', piece.id);
      this.pushNotice({ text: 'Removed', type: 'success' });

      await this.syncData();
    },

    async updatePieceContent(piece, content){
      await this.$utils.updatePieceContent(piece, content);
      await this.syncData();

      this.pushNotice({ text: 'Updated', type: 'success' });
    }
  },

  async mounted(){
    await this.syncData();
  },

  watch: {
    async dataVersion(){
      await this.syncData();
    },

    async currentPiece(){
      if (this.currentPiece === null)
        await this.syncData();
    }
  }
}
</script>

<style lang="scss" scoped>
.timeline {
  padding-left: 6em;

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
    

    .piece {
      position: relative;
      border: 1px solid #e0e0e0;
      padding: .5em 2.8em .5em 1em;
      margin: 1em 0;
      min-height: 5em;
      border-radius: .5em;
      background-color: white;
      
      .time {
        position: absolute;
        left: -4em;
        width: 3em;
        text-align: right;
        font-size: .9em;
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
}
</style>