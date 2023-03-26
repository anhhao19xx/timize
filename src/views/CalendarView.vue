<script setup>
import { ref } from 'vue';

import RCalendar from '../components/RCalendar.vue';

import { useAppStore } from '../stores/app';
import { RDialogActions } from '../constants';
import EventEditor from '../components/EventEditor.vue';

const refEventDialog = ref(null);
const refCalendar = ref(null);

const currentEvent = ref(null);
const appStore = useAppStore();

const addEvent = () => {
  appStore.addEvent(currentEvent.value);
  currentEvent.value = null;
};

const deleteEvent = () => {
  if (currentEvent.value.note && !window.confirm('Do you want to delete?')) {
    currentEvent.value = null;
    return;
  }

  appStore.deleteEvent(currentEvent.value);
  currentEvent.value = null;
  refCalendar.value.clearSelectedRange();
};

const handleAction = (name, event) => {
  currentEvent.value = event;

  switch (name) {
    case RDialogActions.CREATE:
      delete currentEvent.value.id;
      delete currentEvent.value.title;
      break;
    case RDialogActions.EDIT:
      break;
    case RDialogActions.DELETE:
      deleteEvent();
      return;
    case RDialogActions.DUPLICATE:
      delete currentEvent.value.id;
      addEvent();
      return;
    case RDialogActions.TOGGLE_DONE:
      currentEvent.value.done = !currentEvent.value.done;
      updateSingleEvent(currentEvent.value);
      return;
    default:
      return;
  }
};

const updateSingleEvent = (event) => {
  if (!appStore.updateEvent(event)) {
    refEventDialog.value?.hide();
    return;
  }

  currentEvent.value = null;
  refEventDialog.value?.hide();
  refCalendar.value.clearSelectedRange();
};

const loadEvents = (currentDate) => {
  if (!currentDate) return;

  appStore.loadEvents(currentDate);
};
</script>

<template>
  <div class="px-4 my-4">
    <RPanel>
      <EventEditor
        v-if="currentEvent"
        :id="currentEvent.id"
        :form="{
          from: currentEvent.from,
          to: currentEvent.to,
        }"
        @close="
          {
            loadEvents(currentEvent.from);
            currentEvent = null;
            refCalendar.clearSelectedRange();
          }
        "
      />
      <!-- <RDialog ref="refEventDialog" :label="false">
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
      </RDialog> -->

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
