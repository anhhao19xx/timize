<template>
  <div class="main">
    <!-- TASKS -->
    <div class="tasks md-content">
      <Piece v-model="currentPiece"/>
      
      <div v-for="item in taskGroupByStartAt" :key="item.groupValue" class="task-group">
        <DateFormat :date="item.groupValue" v-if="item.groupBy === 'startAt'"></DateFormat>
        <div class="group-title" v-if="!item.groupBy">{{ item.groupValue }}</div>

        <div class="group-tasks">
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
    </div>
    <!-- END TASKS -->

    <!-- TIME TRACKING -->
    <div class="time-tracking">
      <div class="group-title">Time Tracking</div>
      <StopWatch class="clock"/>
    </div>
    <!-- END TIME TRACKING -->
  </div>
</template>

<script>
import moment from 'moment';
import { mapState } from 'vuex';
import DateFormat from '../comps/DateFormat';
import Piece from '../comps/Piece.vue';
import StopWatch from '../comps/StopWatch.vue';

export default {
  components: { DateFormat, Piece, StopWatch },

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
