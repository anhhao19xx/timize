<script setup>
import EyedropIcon from '@rugo-vn/vue/dist/ionicons/EyedropIcon.vue';
import CheckmarkIcon from '@rugo-vn/vue/dist/ionicons/CheckmarkIcon.vue';
import colors from 'tailwindcss/colors';
import { watch, ref } from 'vue';

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

const MID_COLOR = '500';
const EXCLUDE_COLORS = [
  'red',
  'slate',
  'gray',
  'zinc',
  'stone',
  'neutral',
  'lightBlue',
  'warmGray',
  'trueGray',
  'coolGray',
  'blueGray',
];

const selectableColors = [];
for (const name in colors) {
  if (typeof colors[name] !== 'object') continue;

  if (EXCLUDE_COLORS.indexOf(name) !== -1) continue;

  selectableColors.push({
    name,
    code: colors[name][MID_COLOR],
  });
}

const selectedColor = ref('sky');
const isOpened = ref(false);

const syncValue = () => {
  if (selectedColor.value === props.modelValue) return;

  selectedColor.value = props.modelValue;
};

const selectColor = (name) => {
  selectedColor.value = name;
  emit('update:modelValue', name);
  isOpened.value = false;
};

watch(() => props.modelValue, syncValue);
syncValue();
</script>

<template>
  <div class="relative">
    <RButton
      class="w-10 h-10 px-3 py-3 rounded-full block cursor-pointer"
      :style="{
        backgroundColor: colors[selectedColor]?.[MID_COLOR],
      }"
      @click="isOpened = true"
    >
      <EyedropIcon class="text-base" />
    </RButton>

    <div
      v-if="isOpened"
      class="absolute top-[-0.25rem] left-[-0.25rem] w-[11.25rem] h-[11.25rem] bg-white shadow-md rounded-3xl z-10 flex flex-wrap pt-1 pl-1"
    >
      <RButton
        v-for="color in selectableColors"
        :class="`w-10 h-10 rounded-full mx-auto block mb-1 mr-1 cursor-pointer px-2 py-2 ${
          color.name === selectedColor
            ? 'outline outline-2 outline-primary-500 border-2 border-white'
            : ''
        }`"
        :style="{ backgroundColor: color.code }"
        :key="color.name"
        :title="color.name"
        @click="selectColor(color.name)"
      >
        <CheckmarkIcon v-if="color.name === selectedColor" class="text-xl" />
      </RButton>
    </div>
  </div>
</template>
