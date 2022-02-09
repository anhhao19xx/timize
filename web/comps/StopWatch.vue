<template>
  <div class="stop-watch">
    <span class="time" :is-run="running">{{ time }}</span>
    <div class="btn-container">
      <a id="start" @click="start">Start</a>
      <a id="stop" @click="stop">Stop</a>
      <a id="reset" @click="reset">Reset</a>
    </div>
  </div>
</template>

<script>
export default {
  data(){
    return {
      time: '00:00:00',

      timeBegan: null,
      timeStopped: null,
      stoppedDuration: 0,
      started: null,
      running: false,
    }
  },

  methods: {
    zeroPrefix(num, digit) {
      var zero = '';
      for(var i = 0; i < digit; i++) {
        zero += '0';
      }
      return (zero + num).slice(-digit);
    },

    start() {
      if(this.running) return;
      
      if (this.timeBegan === null) {
        this.reset();
        this.timeBegan = new Date();
      }

      if (this.timeStopped !== null) {
        this.stoppedDuration += (new Date() - this.timeStopped);
      }

      this.started = setInterval(() => {
        var currentTime = new Date()
        , timeElapsed = new Date(currentTime - this.timeBegan - this.stoppedDuration)
        , hour = timeElapsed.getUTCHours()
        , min = timeElapsed.getUTCMinutes()
        , sec = timeElapsed.getUTCSeconds();

        this.time = 
          this.zeroPrefix(hour, 2) + ":" + 
          this.zeroPrefix(min, 2) + ":" + 
          this.zeroPrefix(sec, 2);
    }, 100);	
      this.running = true;
    },

    stop() {
      this.running = false;
      this.timeStopped = new Date();
      clearInterval(this.started);
    },

    reset() {
      this.running = false;
      clearInterval(this.started);
      this.stoppedDuration = 0;
      this.timeBegan = null;
      this.timeStopped = null;
      this.time = "00:00:00";
    }
  },

  mounted(){
    
  },

  beforeDestroy(){
    this.stop();
  }
}
</script>
