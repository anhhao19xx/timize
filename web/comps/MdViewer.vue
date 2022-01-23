<template>
  <div class="md-content" v-html="value" ref="mdc"></div>
</template>

<script>

import qs from 'qs';

String.prototype.replaceAt = function(index, replacement) {
  return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}

export default {
  props: ['value'],

  data(){
    return {}
  },

  methods: {
  },

  mounted(){
  },

  watch: {
    value(){
    }
  }
}
</script>