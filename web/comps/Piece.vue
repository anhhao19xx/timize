<template>
  <div class="piece" v-if="data && value">
    <label class="bg" @click="close"></label>
    <div class="wrapper">
      <div class="editor-wrapper">
        <TimizeEditor v-model="content" @input="onInput" @route="doRoute"></TimizeEditor>
      </div>
      <div class="bottom-bar">
        <div class="status">
          <div class="state" :enabled="state === 'unsaved'">Unsaved</div>
          <div class="state" :enabled="state === 'saving'">Saving</div>
          <div class="state" :enabled="state === 'saved'">Saved</div>
        </div>

        <div class="info">
          <div class="state">Shared</div>
          <div class="state">Outdated</div>
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
      if (await this.update())
        this.pushNotice({ text: 'Updated', type: 'success' });

      this.$emit('input', null);
    },

    async doRoute(route){
      await this.update();
      if (route.query.id){
        this.$emit('input', parseInt(route.query.id));
      }
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
  z-index: 100;

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
    padding: 0;

    .editor-wrapper {
      height: calc(100% - 30px);
    }

    .bottom-bar {
      height: 30px;
      line-height: 30px;
      display: flex;
      justify-content: space-between;

      .status,
      .info {
        display: flex;
      }

      .state {
        text-transform: uppercase;
        color: #c0c0c0;
        font-weight: bold;
        font-size: .7em;
        margin: 0 .5em;
      }

      .state[enabled] {
        color: #646464;
      }
    }
  }
}
</style>