<template>
  <div class="p-4 w-9/12 pr-8">
    <m-panel>
      <timize-calendar
        :startAt="startAt"
        :value="data"
        @updateTask="updateTask"
      />
    </m-panel>

    <m-panel class="w-3/12 pr-0 fixed top-0 right-0 p-0 pt-12 h-screen border-l">
      <div class="h-full p-4 overflow-auto">
        <h3 class="mb-4">Unschedule Tasks</h3>

        <ul>
          <li
            class="p-2 border mb-2 rounded-md bg-white cursor-grab transition-all
              hover:shadow hover:translate-y-[-.25rem]"
            v-for="task in unscheduleTasks"
            :key="task.id"
            v-html="task.todo"
            button
            draggable="true"
            @dragstart="dragTask(task, $event)"
          ></li>
        </ul>
      </div>
    </m-panel>
  </div>
</template>

<script>
import moment from 'moment';
import { mapState } from 'vuex';
import Piece from '../comps/Piece.vue';
import HourColumn from '../comps/HourColumn.vue';
import TimizeCalendar from '../comps/TimizeCalendar.vue';


export default {
  components: { Piece, HourColumn, TimizeCalendar },

  data(){
    return {
      data: [],

      currentPiece: null,
      eventResize: {
        event: null,
        y: 0,
        offsetHeight: 0
      },

      startAt: moment().day(0).set({ hour: 0, minute: 0, second: 0 }).toDate()
    }
  },
  
  computed: {
    ...mapState(['dataVersion']),

    unscheduleTasks() {
      const list = [];

      for (let task of this.data){
        if (!task.startAt || !task.endAt){
          list.push(task);
          continue;
        }
      }

      return list;
    }
  },

  methods: {
    formatDate(d){
      return moment(d).format('YYYY')
    },

    async syncData(){
      console.log('Sync data');
      this.data = await this.$db.list('tasks', { $limit: -1 });
    },

    selectPiece(id){
      this.currentPiece = id;
    },

    dragTask(task, e){
      e.dataTransfer.setData("text", JSON.stringify(task));
    },

    async updateTask(task){
      await this.$utils.updateTask(task);

      for (let oldTask of this.data)
        if (oldTask.id === task.id){
          if ((!oldTask.startAt && task.startAt) || (oldTask.startAt && !task.startAt)){
            this.syncData();
          }

          break;
        }
    }
  },

  async mounted(){
    await this.syncData();
  },

  watch: {
    async dataVersion(){
      await this.syncData();
    },
    
    async currentPiece(){
      if (this.currentPiece === null)
        await this.syncData();
    }
  }
}
</script>
