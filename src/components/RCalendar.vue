<script setup>
import { computed, ref, reactive, watch, onMounted, onUnmounted } from 'vue';
import { clone, equals } from 'ramda';

import CalendarIcon from '@rugo-vn/vue/dist/ionicons/CalendarIcon.vue';
import ChevronBackIcon from '@rugo-vn/vue/dist/ionicons/ChevronBackIcon.vue';
import ChevronForwardIcon from '@rugo-vn/vue/dist/ionicons/ChevronForwardIcon.vue';
import CreateIcon from '@rugo-vn/vue/dist/ionicons/CreateIcon.vue';
import TrashIcon from '@rugo-vn/vue/dist/ionicons/TrashIcon.vue';

import colors from 'tailwindcss/colors';
import moment from 'moment';
import { DatePicker } from 'v-calendar';

// input/output
const props = defineProps(['modelValue', 'from', 'to']);
const emit = defineEmits([
  'action',
  'update:modelValue',
  'update:singleEvent',
  'update:currentDate',
]);

// init
const HOURS = 24;
const MINUTES = 60;
const SECONDS = 60;
const MILLISECONDS = 1000;
const EVERY_MINUTE = SECONDS * MILLISECONDS;
const EVERY_DAY = HOURS * MINUTES * SECONDS * MILLISECONDS;
const MID_NIGHT = { hour: 0, minute: 0, second: 0, millisecond: 0 };
const ROUNDED_HOUR = 0.5;
const PLACEHOLDER_EVENT_ID = -1;
const DEFAULT_PLACEHOLDER_EVENT = {
  id: PLACEHOLDER_EVENT_ID,
  from: 0,
  to: 0,
  title: 'Create a new event',
  color: 'sky',
};
const MenuActions = {
  CREATE_OR_EDIT: 'createOrEdit',
  DELETE: 'delete',
};

const refTimeSheet = ref(null);
const now = ref(new Date());
const placeholderEvent = reactive(DEFAULT_PLACEHOLDER_EVENT);
const events = reactive([]);

const currentDate = ref(new Date(props.from || new Date()));
const fromDate = ref(null);
const toDate = ref(null);

const cursorMenuStyle = reactive({});
const menuEvent = ref(null);

let loop = null;
let currentFragmentId = 1;

let isDrag = false;
let selectedEvent = null;
let selectedDate = null;
let originFromDate = null;
let originToDate = null;

let isResize = false;

// methods
const updateDateRange = () => {
  fromDate.value = moment(currentDate.value).startOf('week').toDate();
  toDate.value = moment(currentDate.value)
    .startOf('week')
    .add(7, 'days')
    .toDate();

  emit('update:currentDate', currentDate.value);
};

const syncValue = () => {
  const nextValue = clone(props.modelValue || []);

  if (equals(events, nextValue)) return;

  while (events.length > 0) events.shift();

  for (const event of nextValue) {
    events.push(event);
  }
};

const formatDate = (date, format) => {
  return moment(date).format(format);
};

const formatTime = (hour) => `${hour}:00`;

const shiftWeek = (dir) => {
  currentDate.value = moment(currentDate.value)
    .add(dir * 7, 'days')
    .toDate();
};

const syncTime = () => {
  now.value = new Date();
};

const isSameDate = (d1, d2) => {
  return moment(d1).isSame(moment(d2), 'date');
};

const timePercent = (date) => {
  if (typeof date === 'number') {
    return `${(date / EVERY_DAY) * 100}%`;
  }

  const currentDate = moment(date);
  const hour = currentDate.get('hour');
  const minute = currentDate.get('minute');

  return `${((hour * MINUTES + minute) / (HOURS * MINUTES)) * 100}%`;
};

const isOverlaped = (from, to, nextFrom, nextTo) => {
  const fromDate = moment(from);
  const toDate = moment(to);
  const nextFromDate = moment(nextFrom);
  const nextToDate = moment(nextTo);
  if (fromDate.isBefore(nextFromDate) && toDate.isSameOrBefore(nextFromDate))
    return false;

  if (fromDate.isSameOrAfter(nextToDate) && toDate.isSameOrAfter(nextToDate))
    return false;

  return true;
};

const getFragments = (date) => {
  if (!date) return [];

  const startDate = moment(date);
  startDate.set(MID_NIGHT);
  const endDate = moment(date);
  endDate.set(MID_NIGHT);
  endDate.add(1, 'day');

  const fragments = [];
  const nextEvents = [placeholderEvent, ...events];
  for (const event of nextEvents) {
    const fromDate = moment(event.from);
    const toDate = moment(event.to);

    if (!isOverlaped(startDate, endDate, fromDate, toDate)) continue;

    fragments.push({
      event,
      id: ++currentFragmentId,
      from: fromDate.isBefore(startDate)
        ? startDate.toDate()
        : fromDate.toDate(),
      to: toDate.isSameOrAfter(endDate) ? endDate.toDate() : toDate.toDate(),
      style: {
        backgroundColor: event.done
          ? colors['gray']['500']
          : colors[event.color.split('-')[0]][
              event.color.split('-')[1] || '500'
            ],
        opacity: event === placeholderEvent ? 0.3 : 1,
      },
      isPlaced: false,
    });
  }

  if (fragments.length === 0) return [];

  fragments.sort((a, b) => a.from - b.from);

  // greedy algorithm
  const queue = [...fragments];
  const processes = [];
  while (queue.length) {
    const process = queue.splice(0, 1);
    process[0].processIndex = processes.length;

    let i = 0;
    while (i < queue.length) {
      const lastIndex = process.length - 1;
      const lastFragment = process[lastIndex];
      const currentFragment = queue[i];
      if (
        isOverlaped(
          lastFragment.from,
          lastFragment.to,
          currentFragment.from,
          currentFragment.to
        )
      ) {
        i++;
        continue;
      }
      const selectedFragment = queue.splice(i, 1)[0];
      selectedFragment.processIndex = processes.length;
      process.push(selectedFragment);
    }

    processes.push(process);
  }

  fragments.sort((a, b) => b.processIndex - a.processIndex);

  const placeQueue = [fragments[0]];

  while (placeQueue.length > 0) {
    const fragment = placeQueue.shift();
    let baseFragment;

    for (const nextFragment of fragments) {
      if (
        nextFragment !== fragment &&
        isOverlaped(
          fragment.from,
          fragment.to,
          nextFragment.from,
          nextFragment.to
        )
      ) {
        if (
          !nextFragment.isPlaced &&
          nextFragment.processIndex < fragment.processIndex
        )
          placeQueue.push(nextFragment);

        if (nextFragment.isPlaced) baseFragment = nextFragment;
      }
    }

    const baseWidth = baseFragment
      ? baseFragment.style.width
      : (1 / (fragment.processIndex + 1)) * 100;
    fragment.style.width = baseWidth;

    fragment.style.height = timePercent(fragment.to - fragment.from);
    fragment.style.top = timePercent(fragment.from);
    fragment.style.left = fragment.processIndex * baseWidth;
    fragment.isPlaced = true;

    // check remain fragments
    if (placeQueue.length === 0) {
      for (const nextFragment of fragments)
        if (!nextFragment.isPlaced) placeQueue.push(nextFragment);
    }
  }

  for (const fragment of fragments) {
    if (!fragment.style.width) continue;
    fragment.style.width += '%';
    fragment.style.left += '%';
  }

  return fragments;
};

const floorValue = (value, point) => Math.floor(value / point) * point;
const pointToDate = (e) => {
  const date =
    dates.value[
      Math.floor(
        (e.pageX - refTimeSheet.value.offsetLeft) /
          (refTimeSheet.value.offsetWidth / dates.value.length)
      )
    ];

  const startDate = moment(date);
  startDate.set(MID_NIGHT);

  const hour = floorValue(
    (e.pageY - refTimeSheet.value.offsetTop) /
      (refTimeSheet.value.offsetHeight / HOURS),
    ROUNDED_HOUR
  );
  startDate.set('hour', Math.floor(hour));
  startDate.set('minute', Math.floor((hour % 1) * MINUTES));

  return startDate.toDate();
};

const startDrag = (e) => {
  if (e.button !== 0) return;

  isDrag = true;

  if (selectedEvent) return;

  const startDate = moment(pointToDate(e));

  placeholderEvent.from = startDate.toDate().toISOString();
  placeholderEvent.to = startDate
    .add(ROUNDED_HOUR, 'hour')
    .toDate()
    .toISOString();
};

const nextDrag = (e) => {
  if (selectedEvent) return;

  const date = moment(pointToDate(e));

  let fromDate = moment(placeholderEvent.from);
  let toDate = moment(placeholderEvent.to);

  if (date.isBefore(fromDate)) {
    fromDate = date;
  }

  if (date.isAfter(fromDate)) {
    toDate = date;
  }

  placeholderEvent.from = fromDate.toDate().toISOString();
  placeholderEvent.to = toDate.toDate().toISOString();
};

const moveSelected = (e) => {
  const cursorDate = pointToDate(e);
  const duration = cursorDate - selectedDate;

  if (!duration) return false;

  if (!isResize)
    selectedEvent.from = new Date(+originFromDate + duration).toISOString();

  const tmpTo = new Date(+originToDate + duration).toISOString();
  if (tmpTo > selectedEvent.from) selectedEvent.to = tmpTo;

  return true;
};

const endDrag = (e) => {
  if (e.button !== 0) return;

  if (!isDrag) {
    menuEvent.value = false;
    return;
  }

  isDrag = false;

  if (selectedEvent) {
    if (moveSelected(e)) {
      emit('update:modelValue', clone(events));
      emit('update:singleEvent', clone(selectedEvent));
    } else {
      menuEvent.value = selectedEvent;
      cursorMenuStyle.top = `${e.pageY + 10}px`;
      cursorMenuStyle.left = `${e.pageX + 10}px`;
    }

    isResize = false;
    selectedEvent = null;
    return;
  }

  nextDrag(e);
  isResize = false;
  menuEvent.value = false;
};

const onDrag = (e) => {
  if (!isDrag) return;

  if (selectedEvent) {
    moveSelected(e);
  }

  nextDrag(e);
};

const selectEvent = (e, event) => {
  selectedEvent = event;
  selectedDate = pointToDate(e);
  originFromDate = new Date(event.from);
  originToDate = new Date(event.to);
};

const markAsResize = () => {
  isResize = true;
};

const clearSelectedRange = () => {
  placeholderEvent.from = 0;
  placeholderEvent.to = 0;
};

const callAction = (name) => {
  if (
    menuEvent.value.id === PLACEHOLDER_EVENT_ID &&
    name === MenuActions.DELETE
  ) {
    menuEvent.value = null;
    clearSelectedRange();
    return;
  }

  if (
    menuEvent.value.id === PLACEHOLDER_EVENT_ID &&
    name === MenuActions.CREATE_OR_EDIT
  ) {
    emit('action', 'create', clone(menuEvent.value));
    return;
  }

  if (name === MenuActions.CREATE_OR_EDIT) {
    emit('action', 'edit', clone(menuEvent.value));
    return;
  }

  if (name === MenuActions.DELETE) {
    emit('action', 'delete', clone(menuEvent.value));
    return;
  }
};

// computed
const hours = computed(() => {
  const result = [];
  for (let i = 0; i < HOURS; i++) {
    result.push(i);
  }

  return result;
});

const dates = computed(() => {
  const cursor = moment(fromDate.value);
  cursor.set(MID_NIGHT);

  const endDate = moment(toDate.value);
  endDate.set(MID_NIGHT);

  const result = [];
  while (cursor.isBefore(endDate)) {
    result.push(cursor.toDate());
    cursor.add(1, 'day');
  }

  return result;
});

const months = computed(() => {
  const list = dates.value.map((date) => formatDate(date, 'MMM YYYY'));
  const map = {};
  for (const month of list) {
    map[month] ||= 0;
    map[month]++;
  }

  const result = [];
  for (const month in map) {
    result.push({ value: month, count: map[month] });
  }

  return result;
});

const timeCursorStyle = computed(() => {
  return {
    top: timePercent(now.value),
  };
});

const datePickerAttrs = computed(() => {
  return [
    {
      key: 'today',
      highlight: {
        color: 'blue',
        fillMode: 'outline',
      },
      dates: new Date(),
    },
  ];
});

// events
onMounted(() => {
  loop = setInterval(syncTime, EVERY_MINUTE);
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('mousemove', onDrag);
  syncTime();
});

onUnmounted(() => {
  clearInterval(loop);
  window.removeEventListener('mouseup', endDrag);
  window.removeEventListener('mousemove', onDrag);
});

watch(() => props.modelValue, syncValue, { deep: true });

// exposes
defineExpose({
  clearSelectedRange,
});

// handle
updateDateRange();
syncValue();
</script>

<template>
  <div class="select-none">
    <div class="flex">
      <!-- time label -->
      <div class="w-16 border-r border-l border-b">
        <!-- time label -->
        <div class="w-16 border-t h-24 p-3.5 z-20 relative">
          <DatePicker
            v-model="currentDate"
            @update:modelValue="updateDateRange"
            :attributes="datePickerAttrs"
          >
            <template v-slot="{ togglePopover }">
              <RButton
                class="px-2 py-2 rounded"
                variant="primary"
                @click="togglePopover()"
              >
                <CalendarIcon class="text-lg" />
              </RButton>
            </template>
          </DatePicker>
        </div>
        <!-- end time label -->

        <div
          class="h-12 border-t border-[transparent]"
          v-for="hour in hours"
          :key="`label-${hour}`"
        >
          <div class="text-center mt-[-.5rem]">
            {{ formatTime(hour) }}
          </div>
        </div>
      </div>
      <!-- end time label -->

      <div class="flex-1">
        <div class="flex w-full relative">
          <!-- month header -->
          <div
            class="border-r border-t text-center py-2 h-8"
            v-for="month in months"
            :key="`header-${month}`"
            :style="{
              width: `${(month.count / dates.length) * 100}%`,
            }"
          >
            <div class="h-6 uppercase">{{ month.value }}</div>
          </div>
          <!-- end month header -->

          <!-- date controls -->
          <RButton
            class="absolute left-2 top-[1.125rem] px-2 py-2 rounded-full"
            variant="primary"
            @click="shiftWeek(-1)"
          >
            <ChevronBackIcon />
          </RButton>

          <RButton
            class="absolute right-2 top-[1.125rem] px-2 py-2 rounded-full"
            variant="primary"
            @click="shiftWeek(1)"
          >
            <ChevronForwardIcon />
          </RButton>
          <!-- end date controls -->
        </div>

        <div class="flex w-full">
          <!-- date header -->
          <div
            class="flex-1 border-r border-t text-center h-16 flex flex-col items-center"
            v-for="date in dates"
            :key="`header-${date}`"
          >
            <div class="h-6 uppercase">{{ formatDate(date, 'ddd') }}</div>
            <div
              :class="`h-6 w-6 py-1 font-semibold rounded-full ${
                isSameDate(date, now)
                  ? 'bg-primary-500 text-white'
                  : isSameDate(date, currentDate)
                  ? 'bg-primary-200'
                  : ''
              }`"
            >
              {{ formatDate(date, 'DD') }}
            </div>
          </div>
          <!-- end date header -->
        </div>

        <div ref="refTimeSheet" class="flex w-full">
          <div
            class="date-time-sheet flex-1 border-r border-b relative"
            v-for="date in dates"
            :key="`body-${date}`"
            @mousedown="startDrag($event, date)"
          >
            <!-- time sheet -->
            <div
              class="h-12 border-t"
              v-for="hour in hours"
              :key="`body-${date}-${hour}`"
            ></div>
            <!-- end time sheet -->

            <!-- time cursor -->
            <div
              v-if="isSameDate(date, now)"
              class="absolute w-full border-b-2 border-red-500 before:block before:rounded-full before:w-3 before:h-3 before:bg-red-500 before:absolute before:top-[-.375em] before:left-[-.375rem] z-10"
              :style="timeCursorStyle"
            ></div>
            <!-- end time cursor -->

            <!-- fragments -->
            <div
              :class="`absolute text-white px-1 py-0.5 rounded border-l border-b ${
                fragment.event === menuEvent
                  ? 'outline outline-2 outline-primary-500'
                  : ''
              }`"
              v-for="fragment in getFragments(date)"
              :key="`fragment-${fragment.id}`"
              :style="fragment.style"
              @mousedown="selectEvent($event, fragment.event)"
            >
              {{ fragment.event.title }}
              <button
                class="absolute bottom-0 bg-black w-full left-0 h-1 cursor-ns-resize opacity-10 rounded"
                @mousedown="markAsResize"
              ></button>
            </div>
            <!-- end fragments -->
          </div>
        </div>
      </div>
    </div>

    <div v-if="menuEvent" class="absolute z-10" :style="cursorMenuStyle">
      <div class="bg-white rounded-3xl p-1 shadow-md mb-1">
        <RButton
          class="px-2 py-2 h-8 w-8 rounded-full"
          variant="primary"
          @mousedown="callAction(MenuActions.CREATE_OR_EDIT)"
        >
          <CreateIcon class="text-base" />
        </RButton>
      </div>

      <div class="bg-white rounded-3xl p-1 shadow-md mb-1">
        <RButton
          class="px-2 py-2 h-8 w-8 rounded-full"
          variant="danger"
          @mousedown="callAction(MenuActions.DELETE)"
        >
          <TrashIcon class="text-base" />
        </RButton>
      </div>
    </div>
  </div>
</template>
