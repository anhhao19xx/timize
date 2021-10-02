<template>
  <div class="tasks">
    <Piece v-model="currentPiece"/>
    
    <div v-for="item in taskGroupByStartAt" :key="item.groupValue" class="task-group">
      <DateFormat :date="item.groupValue" v-if="item.groupBy === 'startAt'"></DateFormat>
      <div class="group-title" v-if="!item.groupBy">{{ item.groupValue }}</div>

      <div v-for="task in item.list" :key="`task-${task.id}`" class="task">
        <div v-if="task.endAt" class="time-range">
          <div class="startAt">{{ formatTime(task.startAt) }}</div>
          <div class="endAt">{{ formatTime(task.endAt) }}</div>
        </div>
        <input type="checkbox" onclick="return false;"/>
        <label class="todo" v-html="task.todo" @click="selectPiece(task.piece)"></label>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import { mapState } from 'vuex';
import DateFormat from '../comps/DateFormat';
import Piece from '../comps/Piece.vue';

export default {
  components: { DateFormat, Piece },

  data(){
    return {
      data: [],

      currentPiece: null
    }
  },

  computed: {
    ...mapState(['dataVersion']),

    taskGroupByStartAt(){
      const dates = {};
      const unscheduleTasks = [];

      for (let task of this.data){
        if (!task.startAt){
          unscheduleTasks.push(task);
          continue;
        }

        let startAtDate = moment(task.startAt).format('YYYY-MM-DD');

        if (!dates[startAtDate])
          dates[startAtDate] = [];

        dates[startAtDate].push(task);
      }

      const ls = [];
      for (let startAtDate of Object.keys(dates).sort((a, b) => (a > b ? -1 : 1))){
        ls.push({
          groupBy: 'startAt',
          groupValue: startAtDate,
          list: dates[startAtDate]
        });
      }

      ls.unshift({
        groupBy: null,
        groupValue: 'Unschedule Tasks',
        list: unscheduleTasks
      });

      return ls;
    }
  },

  methods: {
    async syncData(){
      this.data = await this.$db.list('tasks', { done: false, $limit: -1 });
    },

    formatTime(d){
      return moment(d).format('HH:mm')
    },

    selectPiece(id){
      this.currentPiece = id;
    },
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
.tasks {
  padding-left: 4em;

  .group-title {
    font-size: 1.5em;
    font-weight: bold;
    margin-bottom: 1em;
  }

  .task-group {
    margin-top: 1em;
    margin-bottom: 1em;
    
    padding-top: 1em;
    padding-bottom: 1em;

    .task {
      position: relative;

      .time-range {
        position: absolute;
        top: -.2em;
        left: -5em;
        width: 5em;
        text-align: center;

        div {
          font-size: .6em;
          display: inline-block;
        }

        .endAt:before {
          content: '- ';
        }
      }

      input {
        margin: 0 1em;
        display: inline;
      }

      label {
        display: inline;
      }
    }
  }
}
</style>