<script setup>
import { reactive } from 'vue';
import { useAppStore } from '../stores/app';

const appStore = useAppStore();

const form = reactive({});

const signIn = async () => {
  await appStore.login(form);
};
</script>

<template>
  <RInput label="Email" v-model="form.email" @keyup.enter="signIn" />
  <RInput
    label="Password"
    type="password"
    v-model="form.password"
    @keyup.enter="signIn"
  />

  <RButton variant="primary" @click="signIn">Sign In</RButton>
</template>
