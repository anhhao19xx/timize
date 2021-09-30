<template>
  <div class="date-format">
    <div class="date-calling">{{ dateCalling }}</div>
    <div class="date-detail">{{ dateDetail }}</div>
  </div>
</template>

<script>
import moment from 'moment';
import dateFormat from "dateformat";

export default {
  props: ['date'],
  computed: {
    dateCalling(){
      return dateFormat(this.date, 'DDDD');
    },

    dateDetail(){
      return moment(this.date).format('YYYY-MM-DD');
    }
  }
}
</script>

<style lang="scss" scoped>
.date-format {
  margin-bottom: 1em;
  
  .date-calling {
    font-size: 1.5em;
    font-weight: bold;
    display: inline-block;
  }

  .date-detail {
    display: inline-block;
    font-size: 1.15em;
    color: #969696;
  }
}
</style>