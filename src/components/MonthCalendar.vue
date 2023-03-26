<script setup>
import ChevronBackIcon from '@rugo-vn/vue/dist/ionicons/ChevronBackIcon.vue';
import ChevronForwardIcon from '@rugo-vn/vue/dist/ionicons/ChevronForwardIcon.vue';
import moment from 'moment';
import colors from 'tailwindcss/colors';
import { computed, ref } from 'vue';
import { formatDate } from '../utils';

const props = defineProps(['modelValue', 'from']);
const emit = defineEmits(['update:currentDate']);
const currentDate = ref(new Date(props.from || new Date()));

const isInMonth = (d) => {
  return moment(d).isSame(currentDate.value, 'month');
};

const tzEventStyle = (tzEvent) => {
  return {
    backgroundColor: tzEvent.done
      ? colors['gray']['500']
      : colors[tzEvent.color.split('-')[0]][
          tzEvent.color.split('-')[1] || '500'
        ],
  };
};

const shiftMonth = (dir) => {
  currentDate.value = moment(currentDate.value).add(1 * dir, 'month');
  emit('update:currentDate', currentDate.value);
};

const dates = computed(() => {
  const startDate = moment(currentDate.value)
    .startOf('month')
    .startOf('week')
    .toDate();

  const endDate = moment(currentDate.value)
    .endOf('month')
    .endOf('week')
    .toDate();

  const cursor = moment(startDate);
  const result = [];
  while (cursor.isBefore(endDate)) {
    result.push(cursor.toDate());
    cursor.add(1, 'day');
  }

  return result;
});

const weeks = computed(() => {
  const startDate = moment(currentDate.value).startOf('week').toDate();
  const endDate = moment(currentDate.value).endOf('week').toDate();

  const cursor = moment(startDate);
  const result = [];
  while (cursor.isBefore(endDate)) {
    result.push(cursor.toDate());
    cursor.add(1, 'day');
  }

  return result;
});

emit('update:currentDate', currentDate.value);
</script>

<template>
  <div class="uppercase border-t border-l border-r relative p-2">
    <div class="text-base text-center font-semibold">
      {{ formatDate(currentDate, 'MMMM') }}
    </div>
    <!-- date controls -->
    <RButton
      class="absolute left-1 top-[.3rem] px-2 py-2 rounded-full"
      variant="primary"
      @click="shiftMonth(-1)"
    >
      <ChevronBackIcon />
    </RButton>

    <RButton
      class="absolute right-1 top-[.3rem] px-2 py-2 rounded-full"
      variant="primary"
      @click="shiftMonth(1)"
    >
      <ChevronForwardIcon />
    </RButton>
    <!-- end date controls -->
  </div>
  <div class="flex flex-wrap border-r border-b border-secondary-200 relative">
    <div
      v-for="week of weeks"
      :key="`w-${week}`"
      class="w-[14.28%] border-t border-l p-2 border-secondary-200 uppercase text-center"
    >
      {{ formatDate(week, 'ddd') }}
    </div>

    <div
      v-for="date of dates"
      :key="date"
      :class="`w-[14.28%] border-t border-l min-h-[6rem] border-secondary-200 overflow-hidden ${
        isInMonth(date) ? '' : 'bg-secondary-100 grayscale'
      }`"
    >
      <div class="px-2 pt-2 flex justify-end">
        <div class="font-semibold">
          {{ formatDate(date, 'DD') }}
        </div>
      </div>

      <div class="overflow-auto h-[calc(100%-27px)] px-1">
        <div
          v-for="tzEvent in modelValue.filter((e) =>
            moment(e.from).isSame(date, 'day')
          )"
          :key="tzEvent.id"
          class="text-white px-2 py-1 mb-1 rounded"
          :style="tzEventStyle(tzEvent)"
        >
          {{ tzEvent.title }}
        </div>
      </div>
    </div>
  </div>
</template>
