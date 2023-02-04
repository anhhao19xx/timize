<script setup>
import { ref } from 'vue';
import SettingsIcon from '@rugo-vn/vue/dist/ionicons/SettingsIcon.vue';
import CloseIcon from '@rugo-vn/vue/dist/ionicons/CloseIcon.vue';

import RCalendar from './components/RCalendar.vue';
import { useAppStore } from './stores/app';

const appStore = useAppStore();
const isSettingPanelOpened = ref(false);
const toggleSettingPanel = () => {
  isSettingPanelOpened.value = !isSettingPanelOpened.value;
};

appStore.init();

const events = ref([
  {
    id: 1,
    from: '2023-02-03T00:00:00.000Z',
    to: '2023-02-03T03:30:00.000Z',
    title: '1',
    color: 'teal',
  },
  {
    id: 2,
    from: '2023-02-04T00:00:00.000Z',
    to: '2023-02-04T05:00:00.000Z',
    title: '2',
    color: 'lime',
  },
  {
    id: 3,
    from: '2023-02-03T04:00:00.000Z',
    to: '2023-02-03T10:00:00.000Z',
    title: '3',
    color: 'teal',
  },
  {
    id: 4,
    from: '2023-02-04T04:30:00.000Z',
    to: '2023-02-04T06:00:00.000Z',
    title: '4',
    color: 'teal',
  },
  {
    id: 5,
    from: '2023-02-05T06:30:00.000Z',
    to: '2023-02-05T08:00:00.000Z',
    title: '5',
    color: 'teal',
  },
  {
    id: 6,
    from: '2023-02-06T06:30:00.000Z',
    to: '2023-02-06T08:00:00.000Z',
    title: '6',
    color: 'teal',
  },
  {
    id: 7,
    from: '2023-02-07T08:00:00.000Z',
    to: '2023-02-07T10:00:00.000Z',
    title: '7',
    color: 'teal',
  },
  {
    id: 8,
    from: '2023-02-07T23:00:00.000Z',
    to: '2023-02-08T15:00:00.000Z',
    title: '8',
    color: 'teal',
  },
  {
    id: 9,
    from: '2023-02-09T11:00:00.000Z',
    to: '2023-02-09T15:00:00.000Z',
    title: '9',
    color: 'sky',
  },
  {
    id: 10,
    from: '2023-02-09T11:00:00.000Z',
    to: '2023-02-09T15:00:00.000Z',
    title: '10',
    color: 'rose',
  },
]);

const log = console.log;
</script>

<template>
  <RTopBar :rightIcon="SettingsIcon" @action="toggleSettingPanel" />

  <div
    :class="`fixed z-10 top-0 h-screen transition-all w-80 ${
      isSettingPanelOpened ? 'right-0' : 'right-[-20rem]'
    }`"
  >
    <label
      class="bg-black w-screen h-screen block opacity-30 left-0 fixed"
      @click="toggleSettingPanel"
      v-if="isSettingPanelOpened"
    ></label>

    <div class="absolute bg-white top-0 right-0 w-full h-screen">
      <RTopBar :rightIcon="CloseIcon" @action="toggleSettingPanel">
        <template #logo>Settings</template>
      </RTopBar>

      <div class="px-4">
        <RInput label="Username" />
        <RInput label="Password" type="password" />

        <div class="flex justify-evenly">
          <RButton variant="primary" class="w-24 justify-center">Load</RButton>
          <RButton variant="primary" class="w-24 justify-center">Save</RButton>
        </div>
      </div>
    </div>
  </div>

  <div class="p-4">
    <RCalendar v-model="events" @update:currentDate="log" />
  </div>

  <RouterView />
</template>

<style scoped></style>
