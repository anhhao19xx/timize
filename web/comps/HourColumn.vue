<template>
  <div class="tm-hour-column">
    <div class="cell" v-for="hour in hours" :key="`hour-${hour}`"></div>
    <div class="event" 
      v-for="event in localValue" 
      :key="`event-${event.task.id}`" 
      :style="generateEventStyle(event).main" 
    >
      <div 
        class="content" 
        :style="generateEventStyle(event).content"
      >{{ event.task.todo }}</div>
      <div class="resize" @mousedown="startEventResize($event, event)"></div>
    </div>
  </div>
</template>

<script>
import { COLORS } from '../plugins/constants.js';

export default {
  props: ['value'],

  data(){
    return {
      eventResize: {
        event: null,
        y: 0,
        offsetHeight: 0
      },
      localValue: [],
    }
  },

  computed: {
    hours(){
      const ls = [];
      for (let i = 0; i < 24; i++)
        ls.push(i);
      return ls;
    },
  },

  methods: {
    mapColor(color){
      if (COLORS[color])
        return COLORS[color];

      return color;
    },

    generateEventStyle(event){
      const { startAtHour, endAtHour, offsetHour, task, level, maxLevel } = event;

      return {
        main: {
          top: `${startAtHour/24*100}%`,
          height: `${(endAtHour - startAtHour + offsetHour)/24*100}%`,
          width: `${100/maxLevel}%`,
          left: `${100/maxLevel * ( level - 1)}%`
        },
        
        content: {
          'background-color': this.mapColor(task.color) || COLORS['grey'],
          opacity: task.done ? 0.5 : 1
        }
      };
    },

    startEventResize(e, event){
      e.preventDefault();
      this.eventResize.event = event;
      this.eventResize.y = e.pageY;
      this.eventResize.wrapperHeight = e.target.parentElement.parentElement.offsetHeight;
    },

    doEventResize(e){
      const length = e.pageY - this.eventResize.y;

      const { startAtHour, endAtHour } = this.eventResize.event;
      let offsetHour = Math.round(length/this.eventResize.wrapperHeight*24*2)/2;
      if (endAtHour - startAtHour + offsetHour < 0.5)
        offsetHour = 0.5 - endAtHour + startAtHour;
        
      this.eventResize.event.offsetHour = offsetHour;
    },

    endEventResize(e){
      this.doEventResize(e);
      if (this.eventResize.event.offsetHour){
        this.eventResize.event.endAtHour += this.eventResize.event.offsetHour;
        this.eventResize.event.offsetHour = 0; 
        this.$emit('updateEvent', this.eventResize.event);
      }
      this.eventResize.event = null;
    },

    async load(){
      if (!this.value)
        return;

      const strValue = JSON.stringify(this.value);
      if (strValue === JSON.stringify(this.localValue))
        return;

      this.localValue = JSON.parse(strValue);
    }
  },

  async mounted(){
    this.load();
    
    this.mouseUpEvent = window.addEventListener('mouseup', e => {
      if (this.eventResize.event)
        this.endEventResize(e);
    });

    this.mouseMoveEvent = window.addEventListener('mousemove', e => {
      if (this.eventResize.event)
        this.doEventResize(e);
    });
  },

  beforeDestroy(){
    window.removeEventListener('mouseup', this.mouseUpEvent);
    window.removeEventListener('mousemove', this.mouseMoveEvent);
  },

  watch: {
    value(){
      this.load();
    }
  }
}
</script>

<style lang="scss" scoped>
$border: 1px solid var(--border);
$cell-height: 50px;

.tm-hour-column {
  position: relative;

  .cell {
    height: $cell-height;
    border-top: $border;

    &:first-child {
      border-top: none;
    }
  } 

  .event {
    position: absolute;
    font-size: .8em;
    border-right: 1px solid var(--secondary-bg);
    border-bottom: 1px solid var(--secondary-bg);
    overflow: hidden;
    
    .content {
      color: white;
      width: 100%;
      height: 100%;
      padding: .2em .4em;
      border-radius: 4px;
    }

    .resize {
      background-color: rgba(0, 0, 0, .2);
      width: 100%;
      height: 4px;
      cursor: ns-resize;
      margin-top: -4px;
      border-radius: 4px;
    }
  }
}
</style>