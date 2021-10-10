<template>
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
      <div class="wrapper">
        <div class="cell" v-for="hour in hours" :key="`${day}-${hour}`"></div>
        <div class="event" v-for="event in getEventFromTask(day)" :key="event.task.id" :style="event.style" @click="selectPiece(event.task.piece)">
          <div class="content" :style="event.contentStyle">{{ event.task.todo }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import { mapState } from 'vuex';
import Piece from '../comps/Piece.vue';

const COLORS = {
  red: '#D32F2F',
  green: '#388E3C',
  blue: '#1976D2',
  pink: '#C2185B',
  purple: '#7B1FA2',
  indigo: '#303F9F',
  cyan: '#0097A7',
  teal: '#00796B',
  lime: '#AFB42B',
  yellow: '#FBC02D',
  amber: '#FFA000',
  orange: '#F57C00',
  brown: '#5D4037',
  grey: '#616161'
}

export default {
  components: { Piece },

  data(){
    return {
      data: [],
      currentPiece: null,
    }
  },
  
  computed: {
    ...mapState(['dataVersion']),

    hours(){
      const ls = [];
      for (let i = 0; i < 24; i++)
        ls.push(i);
      return ls;
    }
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
    },

    mapColor(color){
      if (COLORS[color])
        return COLORS[color];

      return color;
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
          
        ls.push({
          task,
          style: {
            top: `${startAtHour/24*100}%`,
            height: `${(endAtHour - startAtHour)/24*100}%`,
            width: `100%`
          },
          contentStyle: {
            'background-color': this.mapColor(task.color) || COLORS['grey'],
            opacity: task.done ? 0.5 : 1
          }
        });
      }

      return ls;
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
$border: 1px solid #EAEAEA;
$cell-height: 50px;
$date-cell-height: 60px;

.calendar {
  margin: 1em;
  border-left: $border;
  display: flex;
  background-color: white;

  .column {
    position: relative;
    width: calc(14.285% - 7.1429px);
    
    .cell {
      height: $cell-height;
      border-right: $border;
      border-bottom: $border;      
      position: relative;

      &.date-cell {
        border-top: $border;
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
          background-color: white;
          font-size: .6em;
        }
      }
    }

    .wrapper {
      position: relative;
      overflow: hidden;

      .event {
        position: absolute;
        font-size: .8em;
        border-right: 1px solid white;
        border-bottom: 1px solid white;
        overflow: hidden;
        
        .content {
          color: white;
          width: 100%;
          height: 100%;
          padding: .2em .4em;
          border-radius: 4px;
        }
      }
    }
  }
}
</style>