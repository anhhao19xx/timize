<template>
  <div>
  </div>
</template>


<script>
import { mapMutations, mapState } from 'vuex'

export default {
  computed: {
    ...mapState(['isNotice', 'notices']),
  },
  methods: {
    ...mapMutations(['shiftNotice', 'setIsNotice']),
    pushNotice(){
      if (!this.isNotice)
        return;

      while (this.notices.length){
        let message = this.notices[0];
        this.shiftNotice();

        this.$bvToast.toast(message.text, {
          title: message.title || 'Notice',
          autoHideDelay: 2000,
          variant: message.type,
          appendToast: true,
          toaster: 'b-toaster-bottom-right'
        }); 
      }

      this.setIsNotice(false);
    }
  },
  mounted(){
    this.pushNotice();
  },
  watch: {
    isNotice(){
      this.pushNotice();
    }
  }
}
</script>