<script setup>
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { ref, watch, nextTick } from 'vue';

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue', 'insertImage']);

const editor = ref(null);

const editorOptions = {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike', 'code'],
      [{ header: 1 }, { header: 2 }, 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
      ['image'],
    ],
  },
};

const imageHandler = function () {
  emit('insertImage', this.quill);
};

const onEditorReady = function (quill) {
  quill.getModule('toolbar').addHandler('image', imageHandler);
  quill.root.setAttribute('spellcheck', false);
};

const syncValue = () => {
  if (editor.value.getHTML() !== props.modelValue) {
    editor.value.setHTML(props.modelValue || '');
  }
};

watch(() => [props.modelValue], syncValue);

nextTick(() => {
  syncValue();
});
</script>

<template>
  <div class="m-rich-editor">
    <QuillEditor
      ref="editor"
      contentType="html"
      :options="editorOptions"
      content=""
      @update:content="(event) => $emit('update:modelValue', event)"
      @ready="onEditorReady($event)"
    />
  </div>
</template>

<style lang="scss">
.m-rich-editor {
  .ql-toolbar {
    border-radius: 0.5rem 0.5rem 0 0;
  }

  .ql-container {
    border-radius: 0 0 0.5rem 0.5rem;

    .ql-editor {
      font-family: PoppinsVN, sans-serif;
      font-size: 0.825rem;
      min-height: 84px;
      max-height: 500px;
      padding: 0.75rem;

      img {
        max-width: 50%;
        margin: 1em auto;
        @apply border rounded-lg;
      }

      p {
        margin: 1em 0;
      }

      code {
        font-family: 'Fira Code', monospace;
        font-size: 1em;
      }

      :first-child {
        margin-top: 0;
      }

      :last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
