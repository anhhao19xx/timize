<template>
  <div>
    <hour-column
      :value="value"
    />
  </div>
</template>

<script>
import HourColumn from '../comps/HourColumn.vue'
export default {
  components: { HourColumn },

  data(){
    return {
      value: [
        { 
          id: 0, 
          startAtHour: 9, 
          endAtHour: 10, 
          offsetHour: 0, 
          task: {
            todo: 'task 1',
            color: 'red'
          }, 
          level: 1, 
          maxLevel: 3
        },
        { 
          id: 1, 
          startAtHour: 9.5, 
          endAtHour: 10.5, 
          offsetHour: 0, 
          task: {
            todo: 'task 2',
            color: 'blue'
          }, 
          level: 2, 
          maxLevel: 3
        }
      ]
    }
  }
}
</script>

<style>

</style>