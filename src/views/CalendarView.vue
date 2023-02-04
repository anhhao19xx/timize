<script setup>
import { ref } from 'vue';

import RCalendar from '../components/RCalendar.vue';
import RDialog from '../components/RDialog.vue';
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
  if (!window.confirm('Do you want to delete?')) return;

  appStore.deleteEvent(currentEvent.value);
  currentEvent.value = {};
  refEventDialog.value.hide();
  refCalendar.value.clearSelectedRange();
};

const showEditDialog = (event) => {
  currentEvent.value = event;

  if (event.id === -1) {
    mode.value = RDialogActions.CREATE;
    delete currentEvent.value.id;
    delete currentEvent.value.title;
  } else {
    mode.value = RDialogActions.EDIT;
  }

  refEventDialog.value.show();
};

const updateSelectdDateRange = ({ from, to }) => {
  currentEvent.value.from = from;
  currentEvent.value.to = to;
  mode.value = RDialogActions.CREATE;
};

const updateSingleEvent = (event) => {
  if (!appStore.updateEvent(event)) return;

  currentEvent.value = {};
  refEventDialog.value?.hide();
  refCalendar.value.clearSelectedRange();
};
</script>

<template>
  <RPanel>
    <div class="mb-4 h-8">
      <RButton
        :disabled="true"
        variant="primary"
        v-if="!(currentEvent.from && currentEvent.to)"
        >{{ `${mode === RDialogActions.CREATE ? 'Create' : `Edit`}` }}</RButton
      >

      <RDialog
        v-if="currentEvent.from && currentEvent.to"
        ref="refEventDialog"
        :label="
          mode === RDialogActions.CREATE
            ? 'Create'
            : `Edit &quot;${currentEvent.title}&quot;`
        "
      >
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

        <RButton
          variant="primary"
          @click="
            mode === RDialogActions.CREATE
              ? addEvent()
              : updateSingleEvent(currentEvent)
          "
          >Save</RButton
        >
      </RDialog>

      <RButton
        class="ml-2"
        :disabled="mode !== RDialogActions.EDIT"
        variant="danger"
        @click="deleteEvent"
      >
        {{
          mode === RDialogActions.EDIT
            ? `Delete "${currentEvent.title}"`
            : 'Delete'
        }}
      </RButton>
    </div>

    <RCalendar
      ref="refCalendar"
      :modelValue="appStore.events"
      @selectEvent="showEditDialog"
      @update:selectedRange="updateSelectdDateRange"
      @update:singleEvent="updateSingleEvent"
    />
  </RPanel>
</template>
