<script setup>
import { ref } from 'vue';

import RCalendar from '../components/RCalendar.vue';

import EventForm from '../components/EventForm.vue';
import { useAppStore } from '../stores/app';
import { RDialogActions } from '../constants';

const refEventDialog = ref(null);
const refCalendar = ref(null);

const currentEvent = ref({});
const mode = ref(RDialogActions.CREATE);
const appStore = useAppStore();

const addEvent = () => {
  appStore.addEvent(currentEvent.value);
  currentEvent.value = {};
  refEventDialog.value.hide();
  refCalendar.value.clearSelectedRange();
};

const deleteEvent = () => {
  // if (!window.confirm('Do you want to delete?')) return;

  appStore.deleteEvent(currentEvent.value);
  currentEvent.value = {};
  refEventDialog.value.hide();
  refCalendar.value.clearSelectedRange();
};

const handleAction = (name, event) => {
  currentEvent.value = event;

  switch (name) {
    case RDialogActions.CREATE:
      mode.value = RDialogActions.CREATE;
      delete currentEvent.value.id;
      delete currentEvent.value.title;
      break;
    case RDialogActions.EDIT:
      mode.value = RDialogActions.EDIT;
      break;
    case RDialogActions.DELETE:
      deleteEvent();
      return;
    case RDialogActions.DUPLICATE:
      delete currentEvent.value.id;
      mode.value = RDialogActions.CREATE;
      addEvent();
      return;
    case RDialogActions.TOGGLE_DONE:
      mode.value = RDialogActions.EDIT;
      currentEvent.value.done = !currentEvent.value.done;
      updateSingleEvent(currentEvent.value);
      return;
    default:
      return;
  }

  refEventDialog.value.show();
};

const updateSingleEvent = (event) => {
  if (!appStore.updateEvent(event)) {
    refEventDialog.value?.hide();
    return;
  }

  currentEvent.value = {};
  refEventDialog.value?.hide();
  refCalendar.value.clearSelectedRange();
};

const loadEvents = (currentDate) => {
  if (!currentDate) return;

  appStore.loadEvents(currentDate);
};

loadEvents();
</script>

<template>
  <div class="px-4 my-4">
    <RPanel>
      <RDialog ref="refEventDialog" :label="false">
        <RHeading type="h3">{{
          mode === RDialogActions.CREATE
            ? 'Create a new event'
            : `Edit "${currentEvent.title}" event`
        }}</RHeading>

        <EventForm
          v-model="currentEvent"
          @submit="
            mode === RDialogActions.CREATE
              ? addEvent()
              : updateSingleEvent(currentEvent)
          "
        />

        <div class="flex justify-between">
          <RButton
            variant="primary"
            @click="
              mode === RDialogActions.CREATE
                ? addEvent()
                : updateSingleEvent(currentEvent)
            "
            >Save</RButton
          >

          <RCheckbox
            variant="primary"
            :modelValue="currentEvent['done']"
            @update:modelValue="
              currentEvent['done'] = $event;
              mode === RDialogActions.CREATE
                ? null
                : updateSingleEvent(currentEvent);
            "
          />
        </div>
      </RDialog>

      <RCalendar
        ref="refCalendar"
        :modelValue="appStore.events"
        @update:singleEvent="updateSingleEvent"
        @update:currentDate="loadEvents($event)"
        @action="handleAction"
      />
    </RPanel>
  </div>
</template>
