<script setup>
import uniqid from 'uniqid';
import { onMounted, ref, watch } from 'vue';

const props = defineProps([
  'type',
  'label',
  'variant',
  'modelValue',
  'indeterminate',
]);
defineEmits(['update:modelValue']);

const id = uniqid();
const element = ref(null);

onMounted(() => {
  element.value.indeterminate = props.indeterminate || false;
});

watch(
  () => props.indeterminate,
  (value) => {
    element.value.indeterminate = value || false;
  }
);
</script>

<template>
  <div class="inline-flex items-center mr-4">
    <input
      :type="type || 'checkbox'"
      :class="`m-checkbox ${variant || 'secondary'}
      w-4 h-4 border ${type === 'radio' ? 'rounded-full' : 'rounded'}
      focus:ring-3
      dark:bg-gray-900 dark:border-gray-500 dark:ring-offset-gray-900`"
      :id="`mcheckbox-${id}`"
      :checked="props.modelValue"
      ref="element"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
    <label
      class="mt-0.5 select-none pl-2"
      :for="`mcheckbox-${id}`"
      v-if="props.label"
      >{{ props.label }}</label
    >
  </div>
</template>
