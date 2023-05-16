<script setup>
import moment from 'moment';
import colors from 'tailwindcss/colors';
import { reactive, ref, watch } from 'vue';
import { clone } from 'ramda';
import { ALL_DAY, DATE_OF_BIRTH, MAX_DAY, MAX_YEAR } from '../constants.js';
import { useAppStore } from '../stores/app';
import { isOverlaped } from '../utils';

const emit = defineEmits(['action']);

const appStore = useAppStore();
const data = ref([]);
const dob = ref(localStorage.getItem(DATE_OF_BIRTH));
const labels = reactive({});
const selectRange = ref(null);
const tzEvents = ref([]);
const currentEvents = ref([]);

async function autoSave() {
  if (!moment(dob.value).isValid()) return;

  localStorage.setItem(DATE_OF_BIRTH, dob.value);
}

async function autoData() {
  const startDate = moment(dob.value).startOf('year');

  if (!moment(dob.value).isValid()) return;

  tzEvents.value = await appStore.loadLongTermEvents(MAX_DAY * ALL_DAY);

  data.value = [];

  const today = moment();
  labels.left = (i) => {
    const year = moment(startDate).add(i, 'years').get('year');
    if (year % 5 === 0) return year;
  };

  const endDate = moment(startDate).add(MAX_YEAR, 'years').endOf('year');
  let cursor = moment(startDate);
  let currentYear;
  while (cursor.isBefore(endDate)) {
    const cursorYear = cursor.get('year');
    if (cursorYear !== currentYear) {
      data.value.push([]);
      currentYear = cursorYear;
    }

    const lastBatch = data.value[data.value.length - 1];
    const fragment = {
      from: moment(cursor).startOf('week').toDate(),
      to: moment(cursor).endOf('week').toDate(),
      color: cursor.isBefore(today) ? colors['gray']['300'] : false,
      tzEvents: [],
    };

    for (const event of tzEvents.value)
      if (isOverlaped(fragment.from, fragment.to, event.from, event.to)) {
        fragment.color =
          colors[event.color.split('-')[0]][event.color.split('-')[1] || '500'];
        fragment.tzEvents.push(event);
      }
    lastBatch.push(fragment);

    cursor = cursor.add(1, 'week');
  }
}

async function onSelect(batches) {
  selectRange.value = {
    from: new Date(Math.min(...batches.map((item) => +new Date(item.from)))),
    to: new Date(Math.max(...batches.map((item) => +new Date(item.to)))),
  };

  currentEvents.value = tzEvents.value.filter((tzEvent) =>
    isOverlaped(
      selectRange.value.from,
      selectRange.value.to,
      tzEvent.from,
      tzEvent.to
    )
  );
}

async function createEvent() {
  if (!selectRange.value) return;

  emit('action', 'create', clone(selectRange.value));
}

async function clearSelectedRange() {
  autoData();
}

// exposes
defineExpose({
  clearSelectedRange,
});

watch(
  () => [dob.value],
  () => {
    autoData();
  }
);

autoData();
</script>

<template>
  <div>
    <div class="flex py-4">
      <div class="mr-8">
        <RInput
          label="Your DOB"
          v-model="dob"
          @input="autoSave"
          class="my-0 mb-4"
        />

        <RGridMap :data="data" :labels="labels" @select="onSelect" />
      </div>

      <div class="pt-16 w-full">
        <RButton
          :variant="selectRange ? 'primary' : 'secondary'"
          :disabled="!selectRange"
          @click="createEvent"
          class="mb-4"
        >
          Create
        </RButton>

        <hr />

        <div
          v-for="tzEvent in currentEvents"
          :key="tzEvent.id"
          class="px-2 py-1 hover:bg-gray-100"
          @click="$emit('action', 'edit', clone(tzEvent))"
        >
          {{ tzEvent.title }}
        </div>
      </div>
    </div>
  </div>
</template>
