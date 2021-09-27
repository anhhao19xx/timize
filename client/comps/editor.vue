<template>
  <div class="tm-editor">
    <b-form-textarea
      class="content-editor"
      ref="textarea"
      max-rows="9999"
      v-model="content"
      @input="onInput"
    ></b-form-textarea>
    <div class="content-preview md-content" v-html="previewData"></div>
  </div>
</template>

<script>
export default {
  props: ['value'],

  data(){
    return {
      previewData: '',
      content: '',
      polling: null,
      isChanged: true
    }
  },

  methods: {
    pollData () {
      this.polling = setInterval(() => {
        if (!this.isChanged)
          return;

        this.previewData = this.$md.parse(this.content);
        this.isChanged = false;
      }, 500)
    },
    
    onInput(value){
      this.content = value;
      this.isChanged = true;
      this.$emit('input', this.content);
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.$refs.textarea.focus();
    });

    this.pollData();

    this.content = this.value;
  },

  beforeDestroy () {
    clearInterval(this.polling)
  },

  watch: {
    value(){
      if (this.value === this.content)
        return;

      this.content = this.value;
      this.isChanged = true;
    }
  }
}
</script>

<style lang="scss" scoped>
.tm-editor {
  display: flex;

  .content-editor, 
  .content-preview {
    width: 50%;
    color: black;
    padding: 0.375rem 0.75rem;
  }

  .content-editor {
    overflow-y: hidden !important;  
    font-family: inherit;
    border: none;
    border-radius: 0;
  }

  .content-editor:focus {
    box-shadow: none;
    outline: none;
    border: none;
  }

  .content-preview {
    border-left: 1px solid #e0e0e0;
  }
}
</style>