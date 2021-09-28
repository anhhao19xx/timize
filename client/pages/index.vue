<template>
  <div class="timeline">
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
        <TimizeEditor v-model="currentPieceContent"></TimizeEditor>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { nanoid } from 'nanoid';
import moment from 'moment';
import dateFormat from "dateformat";
import TimizeEditor from '../comps/TimizeEditor.vue';

export default {
  components: { TimizeEditor },

  data(){
    return {
      currentPiece: null,
      currentPieceContent: null
    }
  },

  computed: {
    ...mapState(['data']), 

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
    ...mapActions(['add', 'remove', 'update']),

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

      this.add({
        id: nanoid(),
        title: `Quick note at ${moment(createdAt).format('YYYY-MM-DD HH:mm:ss')}`,
        content: '',
        createdAt
      });
    },

    selectPiece(piece){
      this.currentPiece = piece;
      this.currentPieceContent = this.currentPiece.content;

      this.$bvModal.show('current-piece');
    },

    closeCurrentPieceModal(){
      if (this.currentPieceContent === this.currentPiece.content)
        return;

      this.update({ id: this.currentPiece.id, content: this.currentPieceContent });
      this.currentPiece = null;
      this.currentPieceContent = '';
    },

    removePiece(piece){
      this.remove(piece.id);
    }
  }
}
</script>

<style lang="scss" scoped>
.timeline {
  padding-left: 4em;

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
        left: -4em;
        width: 3em;
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
}
</style>