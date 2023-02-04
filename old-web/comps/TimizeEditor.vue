<template>
  <div class="tm-editor">
    <quill-editor
      ref="timizeEditor"
      v-model="content"
      :options="editorOption"
      @keyup.native="onKeyUp($event)"
      @keydown.native="onKeyDown($event)"
      @blur="onEditorBlur($event)"
      @focus="onEditorFocus($event)"
      @ready="onEditorReady($event)"
    />
    <div 
      class="create-hashtag-popup" 
      ref="createHashtagPopup"
      v-if="hashtagPopup.content"
      :style="{'top': hashtagPopup.y + 'px', left: hashtagPopup.x + 'px'}"
      @mousedown="createHashtag"
    >Create <b>{{ hashtagPopup.content }}</b></div>
  </div>
</template>

<script>
import { quillEditor } from 'vue-quill-editor'

const CHANGE_RATE = 1000;

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
      hashtagPopup: {
        content: '',
        x: 0,
        y: 0
      },
      lastChange: new Date(),

      editorOption: {
        theme: 'bubble',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'], 
            [{ header: 1 }, { header: 2 }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
            ['link']
          ]
        }
      }
    }
  },

  methods: {
    onEditorBlur(quill) {
      this.hashtagPopup.content = null;
    },

    onEditorFocus(quill) {
      this.detectHashtag();
    },
    
    onEditorReady(quill) {
      quill.keyboard.bindings[13].unshift({
        key: 13,
        handler: () => {
          this.detectHashtag();

          if (this.hashtagPopup.content){
            this.createHashtag();
            return false;
          }

          return true;
        }
      });
    },

    onEditorChange({ quill, html, text }) {
      
    },

    scheduleChange(){
      const now = new Date();
      const duration = now - this.lastChange;

      if (duration < CHANGE_RATE){
        setTimeout(() => this.scheduleChange(), CHANGE_RATE - duration);
        return;
      }
      this.lastChange = now;

      this.detectHashtag();
    },

    onKeyUp(e){
      this.scheduleChange();
    },

    onKeyDown(e){

    },

    detectHashtag(){
      const selection = this.editor.getSelection();
      if (!selection)
        return;

      const index = selection.index;

      let isTag = false;
      let i;
      for (i = index - 1; i >= 0; i--){
        let c = this.editor.getText(i, 1);
        if (!/[\w#]/.test(c))
          break;

        if (c === '#'){
          isTag = true;
          break;
        }
      }

      if (isTag){
        if (!this.hashtagPopup.content){
          const selection_dimensions = window.getSelection().getRangeAt(0).getBoundingClientRect();
          this.hashtagPopup.x = selection_dimensions.x;
          this.hashtagPopup.y = selection_dimensions.y;
        }

        this.hashtagPopup.content = this.editor.getText(i, index - i);
      } else
        this.hashtagPopup.content = null;
    },

    createHashtag(e) {
      if (e)
        e.preventDefault();

      const text = this.hashtagPopup.content;
      let index = this.editor.getSelection().index;
      let start = index - text.length;

      // format
      this.editor.insertEmbed(start, 'hashtag', text.slice(1), true);

      // delete hash
      index = this.editor.getSelection().index;
      start = index - text.length;
      this.editor.deleteText(start, text.length); 
    }
  },

  computed: {
    editor() {
      return this.$refs.timizeEditor.quill
    }
  },

  mounted() {
    this.content = this.value;
  },

  watch: {
    content(){
      this.$emit('input', this.content);
    },

    value(){
      if (this.value === this.content)
        return;

      this.content = this.value;
    }
  }
}
</script>