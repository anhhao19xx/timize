<template>
  <div class="container-fluid">
    <b-row>
      <b-col class="pt-3">
        <div class="m-panel">
          <timize-calendar
            :startAt="startAt"
            :value="data"
            @updateTask="updateTask"
          />
        </div>
      </b-col>

      <b-col cols="3">
        <div class="m-panel mt-3">
          <h5>Unschedule Tasks</h5>

          <b-list-group>
            <b-list-group-item
              v-for="task in unscheduleTasks"
              :key="task.id"
              v-html="task.todo"
              button
              draggable="true"
              @dragstart="dragTask(task, $event)"
            ></b-list-group-item>
          </b-list-group>
        </div>
      </b-col>
    </b-row>
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
      }
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
    },

    startAt(){
      return moment().day(0).set({ hour: 0, minute: 0, second: 0 }).toDate();
    }
  },

  methods: {
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

<style lang="scss" scoped>
$border: 1px solid var(--border);
$cell-height: 50px;
$date-cell-height: 60px;
</style>