<template>
  <div> 
    <div class="flex mb-3 justify-between	">
      <small>YEAR: {{ currentYear }}</small>
      <div>
        <button class="border py-1 px-2 text-sm rounded primary" @click="jumpStartAt(-1)">Prev</button>
        <button class="border py-1 px-2 text-sm rounded primary" @click="jumpStartAt(1)">Next</button>
      </div>
    </div>

    <div class="border border-t-0 border-l-0">
      <div class="flex">
        <div class="w-12 border border-r-0 border-b-0"></div>
        <div
          v-for="day in dateRange" 
          :key="day.toString()" 
          class="flex-1 border text-center py-2 border-r-0 border-b-0"
        >
          <div class="text-sm font-bold">{{ getDayOfWeek(day) }} </div>
          <div class="text-sm">{{ formatDate(day) }}</div>
        </div>
      </div>

      <div class="flex">
        <div class="time-column w-12">
          <div 
            class="border border-r-0 border-b-0" 
            v-for="hour in hours" 
            :key="`root-${hour}`" 
            :style="{ height: `${HOUR_HEIGHT}px`}"
          >
            <div class="text-center text-xs bg-white mt-[-.5em]">{{ `${hour}:00` }}</div>
          </div>
        </div>

        <div 
          class="flex-1 flex relative" 
          ref="main"
          @drop="dropTask($event)"
          @dragover="allowDropTask($event)"
        >
          <div 
            v-for="date in dateRange" 
            :key="`date-${date}`" 
            class="flex-1"
          >
            <div 
              class="border border-r-0 border-b-0" 
              v-for="hour in hours" 
              :key="`hour-${hour}`"
              :style="{ height: `${HOUR_HEIGHT}px`}"
            ></div>
          </div>
          <div 
            class="absolute border border-t-0 border-l-0 border-white"
            v-for="fragment in fragments" 
            :key="`fragment-${fragment.id}`"
            :style="fragment.style.main" 
          >
            <div 
              class="rounded text-white text-sm py-0.5 px-1 h-full"
              :style="fragment.style.content"
              @mousedown="startFragmentAction('move', $event, fragment)"
              @click="showTaskInfo(fragment)"
            >
              {{ fragment.task.todo }}
            </div>

            <!-- <b-dropdown class="setting">
              <b-dropdown-form>
                <b-form-group>
                  <b-checkbox @input="updateTask(fragment, 'done', $event)" :checked="fragment.task.done">Done</b-checkbox>
                </b-form-group>
                <b-form-group class="color-group">
                  <button
                    class="color"
                    :data-checked="fragment.task.color === name"
                    v-for="(color, name) in COLORS" 
                    :style="{ color: color }"
                    :key="`color-${name}`"
                    @click="updateTask(fragment, 'color', name)"
                  ></button>
                </b-form-group>
              </b-dropdown-form>
            </b-dropdown> -->

            <!-- <b-checkbox class="check"></b-checkbox> -->

            <div 
              class="bg-black opacity-50 absolute w-full h-1 bottom-0 rounded
                cursor-ns-resize" 
              @mousedown="startFragmentAction('resize', $event, fragment)"
            ></div>
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
    },

    currentYear(){
      return moment(this.localStartAt).format('YYYY');
    }
  },

  methods: {
    ...mapMutations(['incDataVer']),

    jumpStartAt(vector){
      this.localStartAt = moment(this.localStartAt).add(this.localNumberDay * vector, 'days');
      this.init();
    },
    
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
      this.localStartAt = moment(this.startAt || new Date());
      
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
    },
    startAt(){
      this.init();
    }
  }
}
</script>
