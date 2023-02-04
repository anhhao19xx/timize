<script setup>
import { clone, equals } from 'ramda';
import { reactive, watch, defineProps, defineEmits } from 'vue';

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
    <RInput
      label="Color"
      :modelValue="form['color']"
      @update:modelValue="edit('color', $event)"
      @keyup.enter="submitForm"
    />
  </div>
</template>
