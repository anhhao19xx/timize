<script setup>
import { ref } from 'vue';

const props = defineProps(['tabs', 'modelValue']);
defineEmits('update:modelValue');

const currentTab = ref(props.modelValue);
</script>

<template>
  <div>
    <RButton
      :variant="currentTab === tab ? 'primary' : 'secondary'"
      class="mr-2"
      v-for="tab in tabs"
      :key="tab"
      @click="
        {
          currentTab = tab;
          $emit('update:modelValue', tab);
        }
      "
    >
      {{ tab }}
    </RButton>
  </div>
</template>
