<template>
  <div>  
    <div class="tm-calendar">
      <div class="label-row">
        <div class="gap-cell"></div>
        <div v-for="day in dateRange" :key="day.toString()" class="cell">
          <div class="dow">{{ getDayOfWeek(day) }} </div>
          <div class="date">{{ formatDate(day) }}</div>
        </div>
      </div>

      <div class="wrapper">
        <div class="time-column">
          <div class="column-label"></div>
          <div 
            class="cell" 
            v-for="hour in hours" 
            :key="`root-${hour}`" 
            :style="{ height: `${HOUR_HEIGHT}px`}"
          >
            <div class="hour-label">{{ `${hour}:00` }}</div>
          </div>
        </div>

        <div 
          class="main" 
          ref="main"
          @drop="dropTask($event)"
          @dragover="allowDropTask($event)"
        >
          <div v-for="date in dateRange" :key="`date-${date}`" class="column">
            <div 
              class="cell" 
              v-for="hour in hours" 
              :key="`hour-${hour}`"
              :style="{ height: `${HOUR_HEIGHT}px`}"
            ></div>
          </div>
          <div 
            class="fragment"
            v-for="fragment in fragments" 
            :key="`fragment-${fragment.id}`"
            :style="fragment.style.main" 
          >
            <div 
              :class="`content`"
              :style="fragment.style.content"
              @mousedown="startFragmentAction('move', $event, fragment)"
              @click="showTaskInfo(fragment)"
            >
              {{ fragment.task.todo }}
            </div>

            <b-dropdown class="setting">
              <b-dropdown-form>
                <b-form-group>
                  <b-checkbox @input="updateTask(fragment, 'done', $event)" :checked="fragment.task.done">Done</b-checkbox>
                </b-form-group>
                <b-form-group class="color-group">
                  <b-button
                    class="color"
                    :data-checked="fragment.task.color === name"
                    v-for="(color, name) in COLORS" 
                    :style="{ color: color }"
                    :key="`color-${name}`"
                    @click="updateTask(fragment, 'color', name)"
                  ></b-button>
                </b-form-group>
              </b-dropdown-form>
            </b-dropdown>

            <!-- <b-checkbox class="check"></b-checkbox> -->

            <div class="resize" @mousedown="startFragmentAction('resize', $event, fragment)"></div>
          </div>
        </div>
      </div>
    </div>

    <Piece v-model="currentPiece"/>
  </div>
</template>

<script>
import moment from 'moment';
import { mapMutations } from 'vuex';

import { COLORS } from '../plugins/constants.js';
import Piece from './Piece.vue';

const MIN_CELL_WIDTH = 120;
const HOUR_HEIGHT = 50;
const MIN_TIME_RANGE = 30;

export default {
  props: ['value', 'startAt', 'numberDay'],

  components: {
    Piece
  },

  data(){
    return {
      localValue: [],

      localStartAt: null,
      localNumberDay: null,

      currentFragmentId: 0,
      fragments: [],
      unscheduleTasks: [],

      currentPiece: null,

      action: {
        type: '',
        task: null,
        cursor: null
      },

      ghostFragment: null,

      HOUR_HEIGHT,
      COLORS
    }
  },

  computed: { 
    dateRange(){
      const startAt = moment(this.localStartAt);

      const ls = [];
      for (let i = 0; i < this.localNumberDay; i++){
        ls.push(moment(startAt));
        startAt.add(1, 'day');
      }

      return ls;
    },
    
    hours(){
      const ls = [];
      for (let i = 0; i < 24; i++)
        ls.push(i);
      return ls;
    }
  },

  methods: {
    ...mapMutations(['incDataVer']),
    
    resize(){
      if (!this.$refs.main)
        return;
        
      const width = this.getWidth();
      const number = Math.max(Math.min(Math.floor(width / MIN_CELL_WIDTH), 7), 1);
      if (number === this.localNumberDay)
        return;

      this.localNumberDay = number;
    },

    clone(o){
      return JSON.parse(JSON.stringify(o));
    },

    mapColor(color){
      if (COLORS[color])
        return COLORS[color];

      return color;
    },

    roundHour(h){
      return Math.round(h * 60 / MIN_TIME_RANGE) * MIN_TIME_RANGE / 60;
    },

    getWidth(){
      return this.$refs.main.getBoundingClientRect().width;
    },

    buildFragment(fragment){
      let fromHour = this.roundHour(fragment.from.hour() + fragment.from.minute()/60);
      let toHour = this.roundHour(fragment.to.hour() + fragment.to.minute()/60);

      fragment.fromHour = fromHour;
      fragment.toHour = toHour;
      fragment.date = fragment.from.diff(this.localStartAt, 'days');
    },

    buildFragmentStyle(fragment){
      const { fromHour, toHour, maxLevel, level, task } = fragment;

      const columnWidth = 1/this.localNumberDay;
      const offsetLeft = fragment.date/this.localNumberDay;

      fragment.style = {
        main: {
          top: `${fromHour/24*100}%`,
          height: `${(toHour - fromHour)/24*100}%`,
          width: `${100/maxLevel * columnWidth}%`,
          left: `${(1/maxLevel * ( level - 1) * columnWidth + offsetLeft) * 100}%`
        },
        
        content: {
          'background-color': task.done ? '#c0c0c0' : (this.mapColor(task.color) || COLORS['grey'])
        }
      };
    },

    init(){
      console.log('Init');
      
      this.localStartAt = moment(this.startAt || new Date());
      this.unscheduleTasks = [];
      this.fragments = [];

      for (let task of this.localValue){
        let taskStartAt = moment(task.startAt);
        let taskEndAt = moment(task.endAt);

        if (!task.startAt || !task.endAt || taskEndAt.isSameOrBefore(taskStartAt)){
          this.unscheduleTasks.push(task);
          continue;
        }

        let diffDays = moment(task.startAt).diff(this.localStartAt, 'days');

        if (diffDays >= this.localNumberDay){
          continue;
        };

        if (moment(task.endAt).isBefore(this.localStartAt)){
          continue;
        }

        while (taskStartAt.isBefore(taskEndAt, 'day')){
          this.fragments.push({
            id: this.currentFragmentId++,
            from: moment(taskStartAt),
            to: moment(taskStartAt).set({ hour: 23, minute: 59 }),
            task
          });

          taskStartAt.add(1, 'day');
          taskStartAt.set({ hour: 0, minute: 0 });
        }

        this.fragments.push({
          id: this.currentFragmentId++,
          from: taskStartAt,
          to: taskEndAt,
          task
        });
      }

      const lss = {};
      for (let fragment of this.fragments){
        this.buildFragment(fragment);

        // overlap handle
        if (!lss[fragment.date])
          lss[fragment.date] = []; 

        let ls = lss[fragment.date];

        let overlaps = [];
        let levels = [];
        for (let item of ls){
          if (fragment.toHour <= item.fromHour || fragment.fromHour >= item.toHour)
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

        fragment.level = level;
        fragment.maxLevel = maxLevel;

        ls.push(fragment);
      }

      for (let fragment of this.fragments){
        this.buildFragmentStyle(fragment);
      }
    },

    getDayOfWeek(d){
      return moment(d).format('dddd');
    },

    formatDate(d){
      return moment(d).format('DD/MM')
    },

    async load(){
      if (!this.value)
        return;

      const strValue = JSON.stringify(this.value);
      if (strValue === JSON.stringify(this.localValue))
        return;

      this.localValue = JSON.parse(strValue);
      this.$nextTick(() => {
        this.resize();
        this.init();
      });
    },

    getPosition({ x, y }){
      const bbox = this.$refs.main.getBoundingClientRect();
      return {
        x: x - bbox.left,
        y: y - bbox.top
      }
    },

    positionToDate(pos){
      const columnWidth = this.getWidth()/this.localNumberDay;
      const posDate = moment(this.localStartAt).set({ hour: 0, minute: 0 });

      posDate.add(Math.floor(pos.x / columnWidth), 'days');
      posDate.add(this.roundHour(pos.y / HOUR_HEIGHT), 'hours');

      return posDate;
    },

    startFragmentAction(type, e, fragment){
      e.preventDefault();

      if (this.action.event)
        return;

      this.action.type = type;
      this.action.task = fragment.task; 

      const pos = this.getPosition({ x: e.pageX, y: e.pageY });
      this.action.cursor = this.positionToDate(pos);
    },

    doFragmentAction(e){
      const pos = this.getPosition({ x: e.pageX, y: e.pageY });
      const newCursor = this.positionToDate(pos);

      const diffMinute = newCursor.diff(this.action.cursor, 'minutes');
      const diffHour = diffMinute/60;

      const startAt = this.action.task.startAt;
      const endAt = this.action.task.endAt;
      
      let newStartAt = moment(startAt);
      let newEndAt = moment(endAt);

      if (diffHour === 0)
        return;

      newStartAt.add(diffHour, 'hours');
      newEndAt.add(diffHour, 'hours');

      let isUpdate = false;
      if (this.action.type === 'move' && !newStartAt.isSame(startAt)){
        this.action.task.startAt = newStartAt;
        isUpdate = true;
      }

      if (!newEndAt.isSame(endAt)){     
        this.action.task.endAt = newEndAt;
        isUpdate = true;
      }

      if (isUpdate){
        if (moment(this.action.task.endAt).isSameOrBefore(this.action.task.startAt)){
          this.action.task.endAt = moment(this.action.task.startAt).add(MIN_TIME_RANGE, 'minute');
        } else {
          this.action.cursor = newCursor;
        }
        
        this.init();
      }
    },

    endFragmentAction(e){
      if (e)
        this.doFragmentAction(e);
        
      if (moment(this.action.task.startAt).diff(this.localStartAt, 'days') >= this.localNumberDay){
        this.action.task.startAt = null;
        this.action.task.endAt = null;
      };

      this.$emit('updateTask', this.action.task);
      this.action.task = null;
      this.action.type = '';
    },

    dropTask(e){
      const task = JSON.parse(e.dataTransfer.getData('text'));
      const pos = this.getPosition({ x: e.pageX, y: e.pageY });
      const startAt = this.positionToDate(pos);
      task.startAt = startAt;
      task.endAt = moment(startAt).add(1, 'hour');
      this.$emit('updateTask', task);
    },

    allowDropTask(e){
      e.preventDefault();
    },

    showTaskInfo(fragment){
      this.currentPiece = fragment.task.piece;
    },

    updateTask(fragment, name, value){
      fragment.task[name] = value;
      this.buildFragmentStyle(fragment);

      this.$emit('updateTask', fragment.task);
    }
  },

  mounted(){
    this.load();

    this.windowResizeListener = window.addEventListener('resize', () => {
      this.resize();
      this.init();
    });
    this.mouseUpListener = window.addEventListener('mouseup', e => {
      if (this.action.task)
        this.endFragmentAction(e);
    });
    this.mouseMoveListener = window.addEventListener('mousemove', e => {
      if (this.action.task)
        this.doFragmentAction(e);
    });
    this.scrollListener = window.addEventListener('scroll', e => {
      if (this.action.task)
        this.endFragmentAction();
    });
  },

  beforeDestroyed(){
    window.removeEventListener(this.windowResizeListener);
    window.removeEventListener('mouseup', this.mouseUpListener);
    window.removeEventListener('mousemove', this.mouseMoveListener);
    window.removeEventListener('scroll', this.scrollListener);
  },

  watch: {
    value: {
      deep: true,
      handler(){
        this.load();
      }
    },

    currentPiece(){
      if (this.currentPiece !== null)
        return;

      this.incDataVer();
    }
  }
}
</script>

<style lang="scss">
$border: 1px solid var(--border);
$label-cell-height: 60px;
$time-column-width: 50px;

.tm-calendar {
  position: relative;

  .cell,
  .gap-cell {
    position: relative;

    &:before {
      content: ' ';
      display: block;
      position: absolute;
      width: calc(100% + 1px);
      height: calc(100% + 1px);
      border: $border;
      top: 0;
      left: -1px;
    }
  }

  .label-row {
    width: 100%;
    display: flex;

    .gap-cell {
      width: $time-column-width;
      height: $label-cell-height;
    }

    .cell {
      width: auto;
      flex: 1;

      padding-top: .5em;
      
      text-align: center;
      height: $label-cell-height;
      overflow: hidden;

      .dow {
        font-weight: bold;
      }

      .date {
        font-size: .8em;
      }
    }
  }

  .wrapper {
    display: flex;

    .time-column {
      position: relative;
      width: $time-column-width;

      .cell {
        position: relative;

        .hour-label {
          text-align: center;
          position: absolute;
          top: -25px;
          line-height: 50px;
          width: calc(100% - 1px);
          background-color: var(--secondary-bg);
          font-size: .6em;
        }
      }
    }

    .main {
      display: flex;
      flex: 1;
      position: relative;

      .column {
        flex: 1;
      }

      .fragment {
        position: absolute;
        font-size: .8em;
        border-right: 1px solid var(--secondary-bg);
        border-bottom: 1px solid var(--secondary-bg);

        .content {
          background-color: #999;
          color: white;
          width: 100%;
          height: 100%;
          padding: 2.5px 25px 5.5px 5px;
          border-radius: 4px;
        }

        .resize {
          background-color: rgba(0, 0, 0, .2);
          width: 100%;
          height: 4px;
          cursor: ns-resize;
          border-radius: 4px;
          position: absolute;
          bottom: 0;
          left: 0;
        }

        .setting {
          position: absolute;
          top: 0;
          right: 0px;
          
          .btn {
            padding: 0;
            line-height: 1em;
            font-size: inherit;
            width: 20px;
            height: 20px;
            background-color: rgba(255, 255, 255, .1);
            border: none;
            outline: none;

            &:focus {
              outline: none;
              box-shadow: none;
            }
          }

          .dropdown-menu {
            padding: 0;
            margin: 0;

            .b-dropdown-form {
              font-size: .8em;
              padding: .5em .7em;
              padding-bottom: 0;

              .custom-control-label {
                &::before,
                &::after {
                  top: .1em;
                }
              }

              .color-group>div {
                display: flex;
                flex-wrap: wrap;

                .color {
                  width: 20%;
                  padding: 0;

                  padding-top: 20%;

                  margin: 0;
                  left: 0;
                  top: 0;

                  background-image: none;
                  border: none;
                  border-radius: 0;
                  outline: none;
                  background-color: currentColor;
                }

                .color[data-checked] {
                  transform: scale(1.2, 1.2);
                  box-shadow: 0 0 .2em rgba(0, 0, 0, .5);
                }
              }

              .form-group {
                margin-bottom: 5px;
              }
            }
          }
        }
      }
    }
  }
}
</style>