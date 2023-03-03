<script setup>
import { ref, watch } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import SettingsIcon from '@rugo-vn/vue/dist/ionicons/SettingsIcon.vue';
import CloseIcon from '@rugo-vn/vue/dist/ionicons/CloseIcon.vue';
import CalendarIcon from '@rugo-vn/vue/dist/ionicons/CalendarIcon.vue';
import ChatboxIcon from '@rugo-vn/vue/dist/ionicons/ChatboxIcon.vue';
import BookIcon from '@rugo-vn/vue/dist/ionicons/BookIcon.vue';

import RTopBar from './components/RTopBar.vue';
import SignInForm from './components/SignInForm.vue';
import { useAppStore } from './stores/app';

const appStore = useAppStore();
const route = useRoute();

const isSettingPanelOpened = ref(false);
const toggleSettingPanel = () => {
  isSettingPanelOpened.value = !isSettingPanelOpened.value;
};

appStore.loadEvents();
watch(
  () => route.name,
  () => {
    window.scrollTo(0, 0);
  }
);
</script>

<template>
  <div v-if="appStore.token">
    <div class="fixed z-[30] shadow-md top-0 left-0 w-screen">
      <RTopBar :rightIcon="SettingsIcon" @action="toggleSettingPanel">
        <template #topbar>
          <div class="w-full ml-[-2.5rem] h-full flex items-center">
            <RouterLink to="/">
              <RButton
                :variant="route.name === 'calendar' ? 'primary' : 'none'"
                class="px-0 py-0 h-12 w-12 items-center flex flex-col justify-center rounded"
              >
                <CalendarIcon class="text-xl" />
              </RButton>
            </RouterLink>

            <RouterLink to="/notes">
              <RButton
                :variant="route.name === 'notes' ? 'primary' : 'none'"
                class="px-0 py-0 h-12 w-12 items-center flex flex-col justify-center rounded"
              >
                <ChatboxIcon class="text-xl" />
              </RButton>
            </RouterLink>

            <RouterLink to="/contents">
              <RButton
                :variant="route.name === 'contents' ? 'primary' : 'none'"
                class="px-0 py-0 h-12 w-12 items-center flex flex-col justify-center rounded"
              >
                <BookIcon class="text-xl" />
              </RButton>
            </RouterLink>
          </div>
        </template>
      </RTopBar>

      <div
        :class="`fixed z-30 top-0 h-screen transition-all w-80 ${
          isSettingPanelOpened ? 'right-0' : 'right-[-20rem]'
        }`"
      >
        <label
          class="bg-black w-screen h-screen block opacity-30 left-0 fixed"
          @click="toggleSettingPanel"
          v-if="isSettingPanelOpened"
        ></label>

        <div class="absolute bg-white top-0 right-0 w-full h-screen shadow-md">
          <RTopBar :rightIcon="CloseIcon" @action="toggleSettingPanel">
            <template #logo>Settings</template>
          </RTopBar>

          <div class="px-4">
            <RInput label="Email" v-model="appStore.user.email" />
            <RInput
              label="Password"
              type="password"
              v-model="appStore.user.password"
            />

            <div class="flex justify-evenly">
              <RButton
                variant="primary"
                class="w-24 justify-center"
                v-if="appStore.isNotUpToDate"
                @click="appStore.loadFromCloud"
                >Load</RButton
              >
              <RButton
                variant="primary"
                class="w-24 justify-center"
                @click="appStore.saveToCloud"
                v-if="appStore.isChanged"
                >Save</RButton
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-20"></div>

    <RouterView />
  </div>

  <div v-else class="flex items-center justify-center h-[100vh]">
    <RPanel>
      <RHeading type="h2">Sign In</RHeading>
      <SignInForm />
    </RPanel>
  </div>

  <RNotification :notices="appStore.notice.data" />
</template>

<style scoped></style>
