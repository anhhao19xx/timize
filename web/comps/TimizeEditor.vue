<template>
  <quill-editor
    class="tm-editor"
    ref="timizeEditor"
    v-model="content"
    :options="editorOption"
    @blur="onEditorBlur($event)"
    @focus="onEditorFocus($event)"
    @ready="onEditorReady($event)"
  />
</template>

<script>
import { quillEditor } from 'vue-quill-editor'

export default {
  props: [
    'value'
  ],

  components: {
    quillEditor
  },

  data () {
    return {
      content: '',
      editorOption: {
        theme: 'bubble',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'], 
            [{ header: 1 }, { header: 2 }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
          ]
        }
      }
    }
  },

  methods: {
    onEditorBlur(quill) {
      
    },

    onEditorFocus(quill) {
      
    },
    
    onEditorReady(quill) {
      
    },

    onEditorChange({ quill, html, text }) {
      
    }
  },

  computed: {
    editor() {
      return this.$refs.timizeEditor.quill
    }
  },

  mounted() {
    this.content = '<h1>abc</h1><p>def</p><p>ghi</p><p>xyz</p><h2>ghi</h2><p>xxx</p>'; // this.value;
    console.log('Init value', this.content);
  },

  watch: {
    content(){
      this.$emit('input', this.content);
    },

    value(){
      if (this.value === this.content)
        return;

      this.content = '<h1>abc</h1><p>def</p><p>ghi</p><p>xyz</p><h2>ghi</h2><p>xxx</p>'; //this.value;
      console.log('Init value', this.content);
    }
  }
}
</script>

<style lang="scss">
.tm-editor {
  height: 100%;

  .ql-editor {
    padding: .8em;
    font-family: Quicksand, sans-serif;
    font-size: 12pt;
  }
}
</style>