<template>
  <div class="">
    <span class="inline-block heading text-2xl font-normal mr-1">{{ dateCalling }}</span>
    <span class="inline-block font-light">{{ dateDetail }}</span>
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
