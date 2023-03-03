<script setup>
import { ref } from 'vue';
import Tree from 'vue3-treeview';

const toc = ref({
  toc: {
    text: 'Table of Contents',
    children: ['id1', 'id2'],
  },
  id1: {
    text: 'ok la',
  },
  id2: {
    text: 'ok la la',
  },
});
</script>

<template>
  <div class="flex px-4">
    <RPanel class="w-1/5 mt-[0!important]">
      <Tree
        :nodes="toc"
        :config="{
          roots: ['toc'],
          dragAndDrop: true,
          editable: true,
        }"
      />
    </RPanel>
  </div>
</template>
