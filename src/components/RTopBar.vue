<script setup>
defineProps(['leftIcon', 'rightIcon']);
defineEmits(['action']);
</script>

<template>
  <!-- TOPBAR -->
  <header
    class="top-0 right-0 h-16 w-full bg-white border-b border-gray-100 z-20 flex items-center justify-between transition-size w-full dark:bg-[#1d2432] dark:border-[#292f3d]"
  >
    <button
      @click="$emit('action', 'left')"
      class="px-2 mx-4 flex items-center cursor-pointer"
    >
      <component class="text-xl scale-[1.1]" type="outline" :is="leftIcon" />
    </button>
    <slot name="topbar">
      <div class="h-16 px-4 flex items-center">
        <slot name="logo"> </slot>
      </div>
    </slot>
    <button
      @click="$emit('action', 'right')"
      class="px-2 mx-4 flex items-center cursor-pointer"
    >
      <component class="text-xl" type="outline" :is="rightIcon" />
    </button>
  </header>
  <!-- TOPBAR CLOSED -->
</template>
