<template>
  <div class="timeline container-fluid" ref="container">
    <div class="">    
      <div class="w-9/12 pr-8">
        <button class="primary border rounded py-1 px-3 mx-auto my-4 block" @click="addPiece"><big>+</big></button>

        <div 
          v-for="item in dataGroupByDate" 
          :key="item.groupValue" 
          class="ml-16 mt-8"
        >
          <DateFormat :date="item.groupValue"></DateFormat>

          <m-panel 
            v-for="piece in item.list" 
            :key="piece.id" 
            class="mt-4 relative min-h-[9em] rounded-lg"
            @click.native="handleSelectPiece($event, piece)"
          >
            <!-- Time -->
            <div class="absolute top-4 left-[-3rem]">{{ formatTime(piece.createdAt) }}</div>
            <!-- End Time -->

            <!-- Topbar -->
            <div class="absolute top-4 right-4">
              <button @click="copyPiece(piece)" class="block w-8 h-8 leading-8 border border-black mb-2 rounded hover:primary">
                <ion-icon name="link-outline"></ion-icon>
              </button>
              <button @click="sharePiece(piece)" class="block w-8 h-8 leading-8 border border-black mb-2 rounded hover:primary">
                <ion-icon name="share-social-outline"></ion-icon>
              </button>
              <button @click="removePiece(piece)" class="block w-8 h-8 leading-8 border border-red-600 text-red-600 mb-2 rounded hover:danger hover:border-0">
                <ion-icon name="trash-outline"></ion-icon>
              </button>
            </div>
            <!-- End Topbar -->

            <MdViewer 
              class="content pr-10" 
              :value="piece.content" 
              @change="updatePieceContent(piece, $event)"
              @route="doRoute"
            ></MdViewer>
          </m-panel>
        </div>

        <div class="text-center pb-5">
          <button variant="outline-primary" v-if="isMore" @click="loadMore">More</button>
        </div>
      </div>

      <m-panel class="w-3/12 pr-0 fixed top-0 right-0 p-0 pt-12 bg-white h-screen border-l">
        <div class="h-full p-4 overflow-auto">
          <div v-if="top" class="piece" @click="handleSelectPiece($event, top)">
            <MdViewer 
              class="content" 
              :value="top.content" 
              @change="updatePieceContent(top, $event)"
              @route="doRoute"
            ></MdViewer>
          </div>
        </div>
      </m-panel>
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
        e.preventDefault();

        if (e.target.tagName !== 'A')
          return;

        const res = /#\/\?id\=(.*?)$/g.exec(e.target.href);
        if (!res)
          return;

        this.currentPiece = parseInt(res[1]);
        return;
      }

      this.selectPiece(piece);
    },

    copyToClipboard(str){
      function listener(e) {
        e.clipboardData.setData("text/html", str);
        e.clipboardData.setData("text/plain", str);
        e.preventDefault();
      }
      document.addEventListener("copy", listener);
      document.execCommand("copy");
      document.removeEventListener("copy", listener);
    },

    copyPiece(piece){
      const container = this.$refs.container;
      this.copyToClipboard(`<a href="#/?id=${piece.id}">${piece.title}</a>`);
      this.$noti('success', 'Copied');
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
