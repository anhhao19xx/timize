<script setup>
import CloseIcon from '@rugo-vn/vue/dist/ionicons/CloseIcon.vue';
import { ref, watch } from 'vue';
import { useAppStore } from '../stores/app';

const DELAY_INPUT = 500;

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);
const appStore = useAppStore();

const localItem = ref(null);
const results = ref([]);
const isLoading = ref(false);

let searchTimeout;
const search = async (text) => {
  clearTimeout(searchTimeout);

  isLoading.value = true;
  const data = await appStore.searchContent(text);
  isLoading.value = false;
  results.value = data;
};

const preSearch = (text) => {
  isLoading.value = true;
  results.value = [];

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => search(text), DELAY_INPUT);
};

const syncValue = async () => {
  if (localItem.value?.id === props.modelValue) return;

  localItem.value = await appStore.getContent(props.modelValue);
};

watch(() => props.modelValue, syncValue);
watch(
  () => localItem,
  () => emit('update:modelValue', localItem.value?.id),
  { deep: true }
);
syncValue();
</script>

<template>
  <div>
    <label class="text-xs block mb-2 text-gray-600">Content: </label>
    <div class="relative">
      <input
        class="block border w-full p-3 rounded-lg peer outline-none focus:border-black dark:bg-gray-900 dark:border-gray-500 dark:focus:border-primary-500 peer"
        :placeholder="localItem ? '' : `Search something`"
        :disabled="localItem"
        @focus="search($event.target.value)"
        @input="preSearch($event.target.value)"
        @blur="clearSearch"
        @keydown.enter="search($event.target.value)"
      />

      <div
        class="hidden peer-focus:block bg-white drop-shadow rounded absolute w-[calc(100%-1rem)] top-10 mx-2 z-10"
      >
        <div
          v-if="isLoading"
          class="text-center italic text-gray-500 py-2 px-3"
        >
          Searching...
        </div>
        <div v-else-if="results.length">
          <button
            v-for="item in results"
            :key="item._id"
            class="block w-full border-b last:border-none text-left py-2 px-3 hover:bg-gray-50"
            @mousedown="localItem = item"
          >
            {{ item.name }}
          </button>
        </div>
        <div v-else class="text-center italic text-gray-500 py-2 px-3">
          Empty!
        </div>
      </div>

      <button
        v-if="localItem"
        class="rounded-full bg-primary-500 text-white py-1 px-3 absolute top-2 left-2 items-center whitespace-nowrap max-w-[calc(100%-1rem)] overflow-hidden flex"
        @click="localItem = undefined"
      >
        <span class="text-ellipsis overflow-hidden max-w-[calc(100%-1rem)]">
          {{ localItem.name }}
        </span>
        <CloseIcon class="text-base ml-2" />
      </button>
    </div>
  </div>
</template>
