<template>
  <div class="timeline" ref="container">
    <b-row>    
      <b-col cols="9 main">
        <b-button variant="primary" class="add-piece" @click="addPiece"><big>+</big></b-button>

        <div v-for="item in dataGroupByDate" :key="item.groupValue" class="piece-group">
          <DateFormat :date="item.groupValue"></DateFormat>

          <div v-for="piece in item.list" :key="piece.id" class="piece" @click="handleSelectPiece($event, piece)">
            <div class="time">{{ formatTime(piece.createdAt) }}</div>
            <div class="top-bar">
              <!-- <b-button @click="selectPiece(piece)" variant="outline-primary" size="sm">
                <i class="icon icon-pencil"></i>
              </b-button> -->
              <b-button @click="copyPiece(piece)" variant="outline-primary" size="sm">
                <i class="icon icon-link"></i>
              </b-button>
              <b-button @click="sharePiece(piece)" variant="outline-primary" size="sm">
                <i class="icon icon-share"></i>
              </b-button>
              <b-button @click="removePiece(piece)" variant="outline-danger" size="sm">
                <i class="icon icon-trash"></i>
              </b-button>
            </div>
            <MdViewer 
              class="content" 
              :value="piece.content" 
              @change="updatePieceContent(piece, $event)"
              @route="doRoute"
            ></MdViewer>
          </div>
        </div>

        <div class="text-center pb-5">
          <b-button variant="outline-primary" v-if="isMore" @click="loadMore">More</b-button>
        </div>
      </b-col>

      <b-col cols="3" class="pr-0">
        <div class="piece-group top">
          <div v-if="top" class="piece" @click="handleSelectPiece($event, top)">
            <!-- <div class="top-bar">
              <b-button @click="selectPiece(top)" variant="outline-primary" size="sm">
                <i class="icon icon-pencil"></i>
              </b-button>
            </div> -->
            <MdViewer 
              class="content" 
              :value="top.content" 
              @change="updatePieceContent(top, $event)"
              @route="doRoute"
            ></MdViewer>
          </div>
        </div>
      </b-col>
    </b-row>

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

const LIMIT_PER_PAGE = 20;

export default {
  components: { TimizeEditor, DateFormat, Piece, MdViewer },

  data(){
    return {
      data: [],
      page: 1,
      top: null,

      currentPiece: null,
      currentPieceContent: null
    }
  },

  computed: {
    ...mapState(['dataVersion', 'searchText']), 

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
    },

    isMore(){
      return this.data.length === this.page * LIMIT_PER_PAGE
    }
  },

  methods: {
    ...mapMutations(['updateTasks', 'pushNotice']),

    formatTime(d){
      return moment(d).format('HH:mm')
    },

    async syncData(){
      const query = { $limit: LIMIT_PER_PAGE * this.page, $sort: { createdAt: -1 } };

      if (this.searchText){
        query.$search = { $text: this.searchText };
      }

      this.data = await this.$db.list('pieces', query);
      this.top = await this.$db.get('pieces', 1);

      if (this.top)
        return;

      const createdAt = moment('1970/01/01').toDate();
      await this.$db.create('pieces', {
        id: 1,
        title: `Index piece`,
        content: '',
        createdAt: createdAt.toString(),
        updatedAt: createdAt.toString()
      });
      this.top = await this.$db.get('pieces', 1);
    },

    async loadMore(){
      if (!this.isMore)
        return;

      this.page++;
      this.syncData();
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

    handleSelectPiece(e, piece){
      if (['A', 'LABEL', 'INPUT', 'BUTTON'].indexOf(e.target.tagName) !== -1){
        return;
      }

      this.selectPiece(piece);
    },

    copyPiece(piece){
      const container = this.$refs.container;
      this.$copyText(`[${piece.title}](#/?id=${piece.id})`, container);
      this.pushNotice({ type: 'success', text: 'Copied'});
    },

    sharePiece(piece){
      // this.api.
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
    },

    async doQuery(query=this.$route.query){
      const { id } = query || {};
      if (id && !this.currentPiece){
        this.currentPiece = parseInt(id);
        return;
      }

      this.page = 1;
      await this.syncData();
    },

    doRoute(route){
      this.doQuery(route.query);
    }
  },

  async mounted(){
    await this.doQuery();
    await this.syncData();
  },

  watch: {
    async dataVersion(){
      await this.syncData();
    },

    async currentPiece(){
      if (this.currentPiece === null){
        await this.syncData();
      }
    },

    async $route(){
      await this.doQuery();
    },

    async searchText(){
      await this.doQuery();
    }
  }
}
</script>

<style lang="scss" scoped>
.timeline {
  padding-left: 6em;
  padding-right: 1em;
  height: calc(100vh - 50px);
  overflow: hidden;

  .main {
    height: calc(100vh - 50px);
    overflow-y: auto;
  }

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
      border: 1px solid var(--border);
      padding: 1em 2.8em .5em 1em;
      margin: 1em 0;
      min-height: 9.5em;
      border-radius: .5em;
      background-color: var(--secondary-bg);
      
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

    &.top {
      position: sticky;
      top: 50px;
      margin-top: 0;
      padding-top: 0;
      height: calc(100vh - 50px);

      .piece {
        margin: 0;
        border-radius: 0;
        border-top: none;
        border-bottom: none;
        border-right: none;
        height: 100%;
        overflow-y: auto;
      }
    }
  }
}
</style>