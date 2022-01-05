<template>
  <div class="container-fluid">
    <b-row>
      <b-col class="p-0">
        <div class="calendar">
          <Piece v-model="currentPiece"/>

          <div class="column time-column">
            <div class="cell date-cell"></div>
            <div class="cell" v-for="hour in hours" :key="`root-${hour}`">
              <div class="hour-label">{{ `${hour}:00` }}</div>
            </div>
          </div>
          
          <div v-for="day in getWeek()" :key="day.toString()" class="column">
            <div class="cell date-cell">
              <div class="dow">{{ getDayOfWeek(day) }} </div>
              <div class="date">{{ formatDate(day) }}</div>
            </div>
            <hour-column
              :value="days[day]"
              @updateEvent="updateEvent"
            ></hour-column>
          </div>
        </div>
      </b-col>

      <b-col cols="3">
        <div class="m-panel mt-3">
          <h5>Unschedule Tasks</h5>

          <b-list-group>
            <b-list-group-item
              v-for="task in unscheduleTasks"
              :key="task.id"
              v-html="task.todo"
            ></b-list-group-item>
          </b-list-group>
        </div>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import moment from 'moment';
import { mapState } from 'vuex';
import Piece from '../comps/Piece.vue';
import { COLORS } from '../plugins/constants.js';
import HourColumn from '../comps/HourColumn.vue';

export default {
  components: { Piece, HourColumn },

  data(){
    return {
      data: [],
      days: {},

      currentPiece: null,
      eventResize: {
        event: null,
        y: 0,
        offsetHeight: 0
      }
    }
  },
  
  computed: {
    ...mapState(['dataVersion']),

    hours(){
      const ls = [];
      for (let i = 0; i < 24; i++)
        ls.push(i);
      return ls;
    },

    unscheduleTasks() {
      const list = [];

      for (let task of this.data){
        if (!task.startAt || !task.endAt){
          list.push(task);
          continue;
        }
      }

      return list;
    },
  },

  methods: {
    getWeek(d = new Date()){
      const cursor = moment(d);
      const week = [];
      for (let i = 0; i < 7; i++){
        week.push(cursor.day(i).toDate());
      }
      return week;
    },

    getDayOfWeek(d){
      return moment(d).format('dddd');
    },

    formatDate(d){
      return moment(d).format('DD/MM')
    },

    async syncData(){
      this.data = await this.$db.list('tasks', { $limit: -1 });

      this.days = {};
      for (let d of this.getWeek()){
        this.$set(this.days, d, this.getEventFromTask(d));
      }
    },

    getEventFromTask(d){
      const currentDate = moment(d);

      const ls = [];
      for (let task of this.data){
        if (!task.startAt || !task.endAt)
          continue;

        let taskStartAt = moment(task.startAt);
        let taskEndAt = moment(task.endAt);

        if (!taskStartAt.isSame(currentDate, 'day'))
          continue;

        let startAtHour = taskStartAt.hour() + Math.floor(taskStartAt.minute()/15)/4;
        let endAtHour = taskEndAt.hour() + Math.floor(taskEndAt.minute()/15)/4;

        // overlaps event
        let overlaps = [];
        let levels = [];
        for (let item of ls){
          if (endAtHour <= item.startAtHour || startAtHour >= item.endAtHour)
            continue;

          overlaps.push(item);
          levels.push(item.level);
        }

        let level = 1;
        while (levels.indexOf(level) !== -1){
          level++;
        }
        levels.push(level);

        let maxLevel = Math.max.apply(null, levels);
        for (let item of overlaps)
          item.maxLevel = maxLevel;

        let event = {
          startAtHour,
          endAtHour,
          offsetHour: 0,
          level,
          maxLevel,
          task
        };
          
        ls.push(event);
      }

      return ls;
    },

    selectPiece(id){
      this.currentPiece = id;
    },

    updateDateHour(curDate, numberHour){
      const hour = Math.floor(numberHour);
      const minute = Math.floor(numberHour % 1 * 60);

      const d = moment(curDate);
      d.set('hour', hour);
      d.set('minute', minute);

      return d.toDate();
    },

    updateEvent(event){
      const { endAtHour } = event;
      const endAt = this.updateDateHour(event.task.endAt, endAtHour);
      event.task.endAt = endAt.toString();

      this.$utils.updateTask(event.task);
      
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
    },

    days: {
      deep: true,
      handler(){
        console.log(this.days);
      }
    }
  }
}
</script>

<style lang="scss" scoped>
$border: 1px solid var(--border);
$cell-height: 50px;
$date-cell-height: 60px;

.calendar {
  margin: 1em 0 1em 1em;
  border-left: $border;
  border-bottom: $border;
  display: flex;
  background-color: var(--secondary-bg);

  .column {
    position: relative;
    width: calc(14.285% - 7.1429px);
    border-right: $border;
    
    .cell {
      height: $cell-height;
      position: relative;

      &.date-cell {
        border-top: $border;
        border-bottom: $border;

        text-align: center;
        height: $date-cell-height;
        padding: .5em;
        overflow: hidden;

        .dow {
          font-weight: bold;
        }

        .date {
          font-size: .8em;
        }
      }
    }

    &.time-column {
      width: 50px;

      .cell {
        border-top: $border;

        .hour-label {
          text-align: center;
          position: absolute;
          top: -25px;
          line-height: 50px;
          height: 50px;
          width: 100%;
          background-color: var(--secondary-bg);
          font-size: .6em;
        }
      }
    }

    .wrapper {
      position: relative;
      overflow: hidden;

    }
  }
}
</style>