<template>
  <div class="piece" v-if="data && value">
    <label class="bg" @click="close"></label>
    <div class="wrapper">
      <div class="editor-wrapper">
        <TimizeEditor v-model="content" @input="onInput"></TimizeEditor>
      </div>
      <div class="status-bar">
        <div class="state" :enabled="state === 'unsaved'">Unsaved</div>
        <div class="state" :enabled="state === 'saving'">Saving</div>
        <div class="state" :enabled="state === 'saved'">Saved</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions, mapMutations } from 'vuex';
import TimizeEditor from './TimizeEditor.vue';
import moment from 'moment';

const UPDATE_DURATION = 5000;
const R_DATE = /^[0-9]{4}[0-1][0-9][0-3][0-9]$/;
const R_TIMERANGE = /^([0-2]*[0-9]:[0-5]*[0-9])-([0-2]*[0-9]:[0-5]*[0-9])/;
const R_META = /^\((.*?)\)/;
const R_COLOR = /^(red|green|blue|pink|purple|indigo|cyan|teal|lime|yellow|amber|orange|brown|grey)/;

function extract(tokens, types){
  let ls = [];
  for (let token of tokens){
    if (types.indexOf(token.type) !== -1 ){
      ls.push(token);
      continue;
    }

    if (token.tokens){
      ls = ls.concat(extract(token.tokens, types));
    }
  }

  return ls;
}

export default {
  props: ['value'],
  components: { TimizeEditor },

  data(){
    return {
      data: null,
      content: null,
      state: 'unsaved',

      loop: null,
      lastType: new Date(),
      isChanged: false
    }
  },

  methods: {
    ...mapMutations(['pushNotice']),

    async loadData(){
      this.data = await this.$db.get('pieces', this.value);
      this.content = this.data.content;

      this.state = 'saved';
      this.isChanged = false;
    },

    clearData(){
      this.content = null;
      this.state = 'unsaved';
      this.isChanged = false;
    },

    onInput(){
      this.lastType = new Date();     
      this.isChanged = true;

      if (this.state !== 'saved')
        return;

      this.state = 'unsaved';
    },

    async update(){
      if (this.content === this.data.content)
        return false;

      const tokens = this.$md.lexer(this.content);
      let currentDate = null;

      const hashesAndTaskItems = extract(tokens, ['hash', 'taskitem'])

      const tasks = [];

      let index = 0;
      for (let token of hashesAndTaskItems){
        if (token.type === 'hash' && R_DATE.test(token.text))
          currentDate = token.text;

        if (token.type === 'taskitem'){
          let todo = this.$md.marked.Parser.parseInline(token.tokens);

          let rel = R_META.exec(todo);
          let startAt, endAt, color;

          if (rel){
            let metaList = rel[1].split('|').filter(i => i);

            

            for (let meta of metaList){
              // time range meta
              let metaRel = R_TIMERANGE.exec(meta);
              if (metaRel){
                startAt = metaRel[1];
                endAt = metaRel[2];
              }

              // color
              metaRel = R_COLOR.exec(meta);
              if (metaRel){
                color = metaRel[1];
              }
            }

            todo = todo.replace(rel[0], '').trim();
          }

          let task = {
            piece: this.value,
            todo,
            done: token.checked,
            index: index++,
            createdAt: this.data.createdAt.toString()
          }

          if (currentDate){
            if (startAt){
              task.startAt = moment(`${currentDate} ${startAt}:00`, 'YYYYMMDD HH:mm:ss').toDate().toString();
            } else {
              task.startAt = moment(`${currentDate} 00:00:00`, 'YYYYMMDD HH:mm:ss').toDate().toString();
            }

            if (endAt){
              task.endAt = moment(`${currentDate} ${endAt}:00`, 'YYYYMMDD HH:mm:ss').toDate().toString();
            }
          }

          if (color){
            task.color = color;
          }

          tasks.push(task);
        } 
      }

      await this.$db.removeWhere('tasks', { piece: this.value });
      if (tasks.length)
        await this.$db.createMany('tasks', tasks);

      await this.$db.update('pieces', this.value, { content: this.content });

      return true;
    },

    async checkUpdate(){
      const now = new Date();
      if (this.state !== 'unsaved' || !this.isChanged || now - this.lastType < UPDATE_DURATION)
        return;

      this.state = 'saving';

      this.isChanged = false;
      await this.update();

      this.state = 'saved';

      if (this.isChanged)
        this.state = 'unsaved';
    },

    async close(){
      if (await this.update())
        this.pushNotice({ text: 'Updated', type: 'success' });

      this.$emit('input', null);
    }
  },
  
  mounted(){
    this.loop = setInterval(() => {
      this.checkUpdate();
    }, 1000);

    if (!this.value)
      return;

    this.loadData();
  },

  watch: {
    value(){
      if (!this.value){
        this.clearData();
        return;
      }

      this.loadData();
    }
  },

  beforeDestroy(){
    clearInterval(this.loop);
  }
}
</script>

<style lang="scss" scoped>
.piece {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;

  label.bg {
    background-color: rgba(0, 0, 0, .5);
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .wrapper {
    background-color: white;
    position: absolute;
    top: 10%;
    left: 10%;
    width: 80%;
    height: 80%;
    border-radius: .5em;
    padding: 1em 0 0 0.5em;
    overflow: hidden;

    .editor-wrapper {
      height: calc(100% - 30px);
    }

    .status-bar {
      height: 30px;
      line-height: 30px;
      display: flex;

      .state {
        text-transform: uppercase;
        color: #c0c0c0;
        font-size: .7em;
        font-weight: bold;
        margin: 0 .5em;
      }

      .state[enabled] {
        color: #646464;
      }
    }
  }
}
</style>