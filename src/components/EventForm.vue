<script setup>
import { clone, equals } from 'ramda';
import { reactive, watch, defineProps, defineEmits } from 'vue';

import RColorPicker from './RColorPicker.vue';
import RichEditor from './RichEditor.vue';

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue', 'submit']);

const form = reactive({});

const syncValue = () => {
  const nextValue = clone(props.modelValue || {});
  if (equals(form, nextValue)) return;

  for (let key in form) delete form[key];
  for (let key in nextValue) form[key] = nextValue[key];

  form['color'] ||= 'sky';
};

const submitForm = () => {
  emit('update:modelValue', form);
  emit('submit', form);
};

const edit = (prop, value) => {
  form[prop] = value;
  emit('update:modelValue', form);
};

watch(() => props.modelValue, syncValue);
syncValue();
</script>

<template>
  <div>
    <RInput
      label="Title"
      :modelValue="form['title']"
      @update:modelValue="edit('title', $event)"
      @keyup.enter="submitForm"
    />
    <RInput
      label="From"
      :modelValue="form['from']"
      :disabled="true"
      @keyup.enter="submitForm"
    />
    <RInput
      label="To"
      :modelValue="form['to']"
      :disabled="true"
      @keyup.enter="submitForm"
    />

    <div class="flex items-center mb-6">
      <RColorPicker
        class="mr-4"
        :modelValue="form['color']"
        @update:modelValue="edit('color', $event)"
      />

      <RInput
        class="flex-1 my-0"
        label="Color"
        :modelValue="form['color']"
        :disabled="true"
        @update:modelValue="edit('color', $event)"
        @keyup.enter="submitForm"
      />
    </div>

    <div class="mb-6">
      <label class="text-xs block mb-2 text-gray-600">Note:</label>
      <RichEditor
        :modelValue="form['note']"
        @update:modelValue="edit('note', $event)"
      />
    </div>
  </div>
</template>
