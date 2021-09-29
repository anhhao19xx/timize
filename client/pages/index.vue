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
import { mapState, mapActions, mapMutations } from 'vuex';
import { nanoid } from 'nanoid';
import moment from 'moment';
import dateFormat from "dateformat";
import TimizeEditor from '../comps/TimizeEditor.vue';

const R_DATE = /^[0-9]{4}[0-1][0-9][0-3][0-9]$/;
const R_TIMERANGE = /^\(([0-2]*[0-9]:[0-5]*[0-9])-([0-2]*[0-9]:[0-5]*[0-9])\)/;

function extract(tokens, types){
  let ls = [];
  for (let token of tokens){
    if (types.indexOf(token.type) !== -1 ){
      ls.push(token);
      continue;
    }

    if (token.tokens){
      ls = ls.concat(extract(token.tokens, types));
    }
  }

  return ls;
}

export default {
  components: { TimizeEditor },

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

    marked(str){
      return this.$md.parse(str);
    },

    formatDate(d){
      return dateFormat(d, 'DDDD');
    },

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
      this.currentPiece = piece;
      this.currentPieceContent = this.currentPiece.content;

      this.$bvModal.show('current-piece');
    },

    async closeCurrentPieceModal(){
      if (this.currentPieceContent === this.currentPiece.content)
        return;

      const tokens = this.$md.lexer(this.currentPieceContent);
      let currentDate = null;

      const hashesAndTaskItems = extract(tokens, ['hash', 'taskitem'])

      const tasks = [];

      let index = 0;
      for (let token of hashesAndTaskItems){
        if (token.type === 'hash' && R_DATE.test(token.text))
          currentDate = token.text;

        if (token.type === 'taskitem'){
          let todo = this.$md.marked.Parser.parseInline(token.tokens);
          let rel = R_TIMERANGE.exec(todo);
          let startAt, endAt;

          if (rel){
            startAt = rel[1];
            endAt = rel[2];
            todo = todo.replace(rel[0], '').trim();
          }

          let task = {
            piece: this.currentPiece.id,
            todo,
            done: token.checked,
            index: index++,
            createdAt: this.currentPiece.createdAt.toString()
          }

          if (currentDate){
            if (startAt){
              task.startAt = moment(`${currentDate} ${startAt}:00`, 'YYYYMMDD HH:mm:ss').toDate().toString();
            } else {
              task.startAt = moment(`${currentDate} 00:00:00`, 'YYYYMMDD HH:mm:ss').toDate().toString();
            }

            if (endAt){
              task.endAt = moment(`${currentDate} ${endAt}:00`, 'YYYYMMDD HH:mm:ss').toDate().toString();
            }
          }

          tasks.push(task);
        } 
      }

      await this.$db.removeWhere('tasks', { piece: this.currentPiece.id });
      if (tasks.length)
        await this.$db.createMany('tasks', tasks);

      await this.$db.update('pieces', this.currentPiece.id, { content: this.currentPieceContent });
      this.pushNotice({ text: 'Updated', type: 'success' });

      await this.syncData();

      this.currentPiece = null;
      this.currentPieceContent = '';
    },

    async removePiece(piece){
      await this.$db.remove('pieces', piece.id);
      this.pushNotice({ text: 'Removed', type: 'success' });

      await this.syncData();
    }
  },

  async mounted(){
    await this.syncData();
  },

  watch: {
    async dataVersion(){
      await this.syncData();
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