<template>
  <div class="md-content" v-html="html" ref="mdc"></div>
</template>

<script>

import qs from 'qs';

String.prototype.replaceAt = function(index, replacement) {
  return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}

export default {
  props: ['value'],

  data(){
    return {
      html: '',
      version: 0
    }
  },

  methods: {
    parseData(){
      this.html = this.$md.parse(this.value);

      this.$nextTick(() => {
        const checkboxs = this.$refs.mdc.querySelectorAll('.task-item input[type="checkbox"]');

        for (let taskIndex = 0; taskIndex < checkboxs.length; taskIndex++){
          let taskElm = checkboxs[taskIndex];

          taskElm.onchange = e => {
            let r_search = /^[+-] \[([ xX])\]([^\n]*)(?:\n|$)/gm;
            let counter = -1;
            let rel;
            while (counter < taskIndex){
              rel = r_search.exec(this.value);
              counter++;
            }

            this.$emit('change', this.value.replaceAt(rel.index + 3, taskElm.checked ? 'x' : ' '));
          }
        };

        const links = this.$refs.mdc.querySelectorAll('a');
        for (let link of links){
          let href = link.getAttribute('href');

          if (href.indexOf('#') !== 0){
            link.setAttribute('target', '_blank');
            continue;
          }

          link.onclick = e => {
            const href = e.target.getAttribute('href').substr(1);
            const url = new URL(`http://localhost${href[0] === '/' ? href : ('/' + href)}`);
            const route = {
              path: url.pathname
            }

            if (url.search)
              route.query = qs.parse(url.search.substr(1));

            this.$emit('route', route);
            return false;
          }
        }
      });
    }
  },

  mounted(){
    this.parseData();
  },

  watch: {
    value(){
      this.parseData();
    }
  }
}
</script>