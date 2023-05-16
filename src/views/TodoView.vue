<script setup>
import { clone } from 'ramda';
import { ref, computed } from 'vue';
import humanizeDuration from 'humanize-duration';
import EventEditor from '../components/EventEditor.vue';
import { useAppStore } from '../stores/app';
import { EVENT_LABELS } from '../constants.js';
import moment from 'moment';

const appStore = useAppStore();
const current = ref('');
const currentEventId = ref(null);

const fragments = computed(() => {
  const currentEvents = clone(appStore.events);

  currentEvents.sort((a, b) =>
    new Date(a.from).toISOString().localeCompare(new Date(b.from).toISOString())
  );

  const doneList = currentEvents.filter((a) => a.done).reverse();
  const notDoneList = currentEvents.filter((a) => !a.done);

  return [...notDoneList, ...doneList];
});

async function submitTodo() {
  console.log(current.value);
  current.value = '';
}

function loadEvents(currentDate = new Date()) {
  appStore.loadEvents(currentDate, false);
}

function calcDuration(tzEvent) {
  const now = moment();
  const from = moment(tzEvent.from);
  const to = moment(tzEvent.to);

  if (now.isBefore(from))
    return (
      'Next ' + humanizeDuration(from.toDate() - now.toDate(), { largest: 1 })
    );

  if (now.isBefore(to))
    return (
      humanizeDuration(to.toDate() - now.toDate(), { largest: 1 }) + ' left'
    );

  return (
    humanizeDuration(now.toDate() - to.toDate(), { largest: 1 }) + ' before'
  );
}

function getStatus(tzEvent) {
  const now = moment();
  const from = moment(tzEvent.from);
  const to = moment(tzEvent.to);

  if (now.isAfter(to)) return 'Due';

  if (now.isAfter(from)) return 'Current';

  const duration = (from.toDate() - now.toDate()) / 1000 / 60 / 60;
  const isUrgent = duration < 48;
  const isImportant = !!tzEvent.important;

  return EVENT_LABELS[isUrgent][isImportant];
}

loadEvents();
</script>

<template>
  <div class="px-4 my-4 todo-view">
    <EventEditor
      v-if="currentEventId"
      :id="currentEventId"
      @close="
        {
          currentEventId = null;
          loadEvents();
        }
      "
    />

    <RPanel>
      <RInput
        label="Quick enter what to do... then press Enter"
        class="my-0 mb-4"
        v-model="current"
        @keyup.enter="submitTodo"
      ></RInput>

      <div
        v-for="tzEvent in fragments"
        :key="tzEvent.id"
        :class="`p-2 flex items-center hover:bg-gray-100 cursor-pointer ${
          tzEvent.done ? 'done' : ''
        }`"
      >
        <div class="flex items-center">
          <RCheckbox :modelValue="tzEvent.done" />
        </div>
        <div
          :class="`${tzEvent.done ? 'line-through' : ''} flex-1`"
          @click="currentEventId = tzEvent.id"
        >
          {{ tzEvent.title }}
        </div>
        <div>
          {{ calcDuration(tzEvent) }}
        </div>
        <div
          :class="`${getStatus(
            tzEvent
          ).toLowerCase()} text-white px-1 rounded ml-2`"
        >
          {{ getStatus(tzEvent) }}
        </div>
      </div>
    </RPanel>
  </div>
</template>

<style>
.todo-view .done {
  @apply grayscale;
}

.todo-view .due,
.todo-view .critical {
  @apply bg-red-500;
}

.todo-view .crucial {
  @apply bg-orange-500;
}

.todo-view .pressing {
  @apply bg-amber-500;
}

.todo-view .trivial {
  @apply bg-lime-500;
}

.todo-view .current {
  @apply bg-emerald-500;
}
</style>
