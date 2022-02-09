<template>
  <div class="tm-hour-column" :dragType="eventAction.type">
    <div class="cell" v-for="hour in hours" :key="`hour-${hour}`"></div>
    <div class="event" 
      v-for="event in localValue" 
      :key="`event-${event.task.id}`" 
      :style="generateEventStyle(event).main" 
      @mousedown="startEventAction('move', $event, event)"
    >
      <div 
        class="content" 
        :style="generateEventStyle(event).content"
      >{{ event.task.todo }}</div>
      <div class="resize" @mousedown="startEventAction('resize', $event, event)"></div>
    </div>
  </div>
</template>

<script>
import { COLORS } from '../plugins/constants.js';

export default {
  props: ['value'],

  data(){
    return {
      eventAction: {
        type: '',
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
      const { startAtHour, endAtHour, offsetHour, translateHour, task, level, maxLevel } = event;

      console.log(translateHour);

      return {
        main: {
          top: `${(startAtHour + translateHour)/24*100}%`,
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

    startEventAction(type, e, event){
      e.preventDefault();

      if (this.eventAction.event)
        return;

      this.eventAction.type = type;
      this.eventAction.event = event;
      this.eventAction.y = e.pageY;
      this.eventAction.wrapperHeight = e.target.parentElement.parentElement.offsetHeight;
    },

    doEventAction(e){
      const length = e.pageY - this.eventAction.y;

      const { startAtHour, endAtHour } = this.eventAction.event;

      if (this.eventAction.type === 'resize'){
        let offsetHour = Math.round(length/this.eventAction.wrapperHeight*24*2)/2;
        if (endAtHour - startAtHour + offsetHour < 0.5)
          offsetHour = 0.5 - endAtHour + startAtHour;
          
        this.eventAction.event.offsetHour = offsetHour;
      } else {
        let translateHour = Math.round(length/this.eventAction.wrapperHeight*24*2)/2;
        this.eventAction.event.translateHour = translateHour;
      }
    },

    endEventAction(e){
      this.doEventAction(e);
      if (this.eventAction.event.offsetHour){
        if (this.eventAction.type === 'resize'){
          this.eventAction.event.endAtHour += this.eventAction.event.offsetHour;
          this.eventAction.event.offsetHour = 0; 
        }

        this.$emit('updateEvent', this.eventAction.event);
      }

      this.eventAction.event = null;
      this.eventAction.type = '';
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
      if (this.eventAction.event)
        this.endEventAction(e);
    });

    this.mouseMoveEvent = window.addEventListener('mousemove', e => {
      if (this.eventAction.event)
        this.doEventAction(e);
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
