<template>
  <quill-editor
    ref="myQuillEditor"
    v-model="content"
    :options="editorOption"
    @blur="onEditorBlur($event)"
    @focus="onEditorFocus($event)"
    @ready="onEditorReady($event)"
  />
</template>

<script>
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'

import { quillEditor } from 'vue-quill-editor'

export default {
  components: {
    quillEditor
  },

  data () {
    return {
      content: '<h2>I am Example</h2>',
      editorOption: {
        modules: {}
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
      return this.$refs.myQuillEditor.quill
    }
  },

  mounted() {
   
  }
}
</script>