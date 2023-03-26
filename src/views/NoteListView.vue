<script setup>
import PencilIcon from '@rugo-vn/vue/dist/ionicons/PencilIcon.vue';
import moment from 'moment';
import { clone } from 'ramda';
import { computed, ref } from 'vue';
import EventEditor from '../components/EventEditor.vue';
import { useAppStore } from '../stores/app';

const appStore = useAppStore();
const currentEventId = ref(null);

const fragments = computed(() => {
  const currentEvents = clone(appStore.events);

  currentEvents
    .sort((a, b) =>
      new Date(a.from)
        .toISOString()
        .localeCompare(new Date(b.from).toISOString())
    )
    .reverse();

  const result = [];

  for (const tzEvent of currentEvents) {
    if (!tzEvent.note) continue;

    const lastFragment = result.length > 0 ? result[result.length - 1] : null;

    result.push({
      firstMonthYear:
        !lastFragment ||
        formatDateTime(lastFragment.event.from, 'MMM YYYY') !==
          formatDateTime(tzEvent.from, 'MMM YYYY'),
      firstDay:
        !lastFragment ||
        formatDateTime(lastFragment.event.from, 'YYYY MM DD') !==
          formatDateTime(tzEvent.from, 'YYYY MM DD'),
      event: tzEvent,
    });
  }

  return result;
});

const formatDateTime = (d, f) => moment(d).format(f);

const loadEvents = (currentDate) => {
  if (!currentDate) return;

  appStore.loadEvents(currentDate);
};

loadEvents(new Date());
</script>

<template>
  <EventEditor
    v-if="currentEventId"
    :id="currentEventId"
    @close="
      {
        currentEventId = null;
        loadEvents(new Date());
      }
    "
  />

  <div class="px-4 mb-4" v-for="fragment in fragments" :key="fragment.event.id">
    <div class="text-base my-6" v-if="fragment.firstMonthYear">
      {{ formatDateTime(fragment.event.from, 'MMM YYYY') }}
    </div>

    <div class="flex">
      <div
        class="w-12 h-14 inline-flex items-center justify-center text-lg"
        v-if="fragment.firstDay"
      >
        <span>
          {{ formatDateTime(fragment.event.from, 'DD') }}
        </span>
      </div>

      <div
        class="w-12 h-14 inline-flex items-center justify-center text-lg"
        v-else
      ></div>

      <div class="w-16 h-14 inline-flex items-center justify-center pr-2">
        <span>
          {{ formatDateTime(fragment.event.from, 'HH:mm') }}
        </span>
      </div>

      <RPanel class="overflow-hidden flex-1 mt-[0!important] relative">
        <RButton
          class="px-0 py-0 w-8 h-8 justify-center absolute top-2 right-2"
          variant="primary"
          @click="currentEventId = fragment.event.id"
        >
          <PencilIcon class="text-lg" />
        </RButton>
        <div class="content" v-html="fragment.event.note"></div>
      </RPanel>
    </div>
  </div>
</template>

<style lang="scss">
.content {
  font-family: PoppinsVN, sans-serif;
  font-size: 0.825rem;

  img {
    max-width: 50%;
    margin: 1em auto;
    @apply border rounded-lg;
  }

  p {
    margin: 1em 0;
  }

  :first-child {
    margin-top: 0;
  }

  :last-child {
    margin-bottom: 0;
  }

  h1 {
    font-size: 2em;
  }

  h2 {
    font-size: 1.5em;
  }

  code {
    @apply bg-gray-100 py-1 px-2 rounded;
  }

  pre {
    @apply bg-black text-white px-4 py-2 rounded-lg font-bold;
  }
}
</style>
