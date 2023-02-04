<script setup>
import { ref } from 'vue';
import SettingsIcon from '@rugo-vn/vue/dist/ionicons/SettingsIcon.vue';
import CloseIcon from '@rugo-vn/vue/dist/ionicons/CloseIcon.vue';

import { useAppStore } from './stores/app';
import { RouterView } from 'vue-router';
import RNotification from './components/RNotification.vue';

const appStore = useAppStore();

const isSettingPanelOpened = ref(false);
const toggleSettingPanel = () => {
  isSettingPanelOpened.value = !isSettingPanelOpened.value;
};
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

  <RouterView />

  <RNotification :notices="appStore.notice.data" />
</template>

<style scoped></style>
