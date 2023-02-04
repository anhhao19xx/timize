<template>
  <div class="fixed top-0 left-0 w-screen h-screen z-10 overflow-auto" v-if="data && value">
    <label class="w-full h-full fixed top-0 left-0 bg-black opacity-60" @click="close"></label>
    <div class="bg-white border container mx-auto my-10 relative z-20 shadow-lg rounded-lg">
      <div class="editor-wrapper">
        <TimizeEditor 
          v-model="content" 
          @input="onInput" 
          @route="doRoute"
          @click.native="doClick"
        ></TimizeEditor>
      </div>
      <div class="flex justify-between text-slate-300 font-bold text-xs uppercase py-1">
        <div class="flex">
          <div class="pl-3 m-active:text-slate-600" :active="state === 'unsaved'">Unsaved</div>
          <div class="pl-3 m-active:text-slate-600" :active="state === 'saving'">Saving</div>
          <div class="pl-3 m-active:text-slate-600" :active="state === 'saved'">Saved</div>
        </div>

        <div class="flex">
          <div class="pr-3 m-active:text-slate-600">Shared</div>
          <div class="pr-3 m-active:text-slate-600">Outdated</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import { mapState, mapActions, mapMutations } from 'vuex';
import TimizeEditor from './TimizeEditor.vue';

const UPDATE_DURATION = 5000;


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

    formatDate(d){
      return moment(d).format('YYYY-MM-DD HH:mm')
    },

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

      return await this.$utils.updatePieceContent(this.data, this.content);
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
      await this.update()
      this.$emit('input', null);
    },

    async doRoute(route){
      await this.update();
      if (route.query.id){
        this.$emit('input', parseInt(route.query.id));
      }
    },

    async doClick(e){
      if (e.target.tagName !== 'A')
        return;

      const res = /#\/\?id\=(.*?)$/g.exec(e.target.href);
      if (!res)
        return;

      e.preventDefault();

      await this.update();
      this.$emit('input', parseInt(res[1]));
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
