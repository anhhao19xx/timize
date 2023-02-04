<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const props = defineProps([
  'label',
  'variant',
  'disableHotKey',
  'disableDefaultClose',
]);
const emit = defineEmits(['close']);

const isOpened = ref(false);
const dialog = ref(null);

defineExpose({
  show() {
    isOpened.value = true;
  },

  hide() {
    isOpened.value = false;
  },

  toggle() {
    isOpened.value = !isOpened.value;
  },
});

const cancelHotKey = (e) => {
  if (e.key === 'Escape') {
    if (!props.disableDefaultClose) isOpened.value = false;

    emit('close');
  }
};

const handleClick = (e) => {
  if (e.target === dialog.value) {
    if (!props.disableDefaultClose) isOpened.value = false;

    emit('close');
  }
};

onMounted(() => {
  if (!props.disableHotKey) window.addEventListener('keyup', cancelHotKey);
});

onUnmounted(() => {
  if (!props.disableHotKey) window.removeEventListener('keyup', cancelHotKey);
});
</script>

<template>
  <slot
    name="open"
    :click="
      () => {
        isOpened = true;
      }
    "
  >
    <RButton
      :variant="props.variant || 'primary'"
      @click="isOpened = true"
      v-if="props.label !== false"
      >{{ props.label || 'Open Dialog' }}</RButton
    >
  </slot>

  <div
    class="m-dialog fixed h-screen w-screen top-0 left-0 z-30 overflow-auto p-4 select-none"
    v-if="isOpened"
    ref="dialog"
    @mousedown="handleClick"
  >
    <label
      for="m-control-dialog"
      class="h-screen w-screen fixed top-0 left-0 z-[-10] bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-80 pointer-events-none"
    ></label>
    <div
      class="m-content-dialog bg-white max-w-3xl w-full mx-auto my-12 p-4 rounded-lg relative z-30 dark:bg-[#1d2432] dark:border dark:border-[#292f3d] select-text"
    >
      <slot></slot>
    </div>
  </div>
</template>
