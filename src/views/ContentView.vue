<script setup>
// import uniqid from 'uniqid';
// import Tree from 'vue3-treeview';
// import TrashIcon from '@rugo-vn/vue/dist/ionicons/TrashIcon.vue';
import CaretForwardIcon from '@rugo-vn/vue/dist/ionicons/CaretForwardIcon.vue';
import AddIcon from '@rugo-vn/vue/dist/ionicons/AddIcon.vue';
import EyeIcon from '@rugo-vn/vue/dist/ionicons/EyeIcon.vue';
import EyeOffIcon from '@rugo-vn/vue/dist/ionicons/EyeOffIcon.vue';
import CheckmarkIcon from '@rugo-vn/vue/dist/ionicons/CheckmarkIcon.vue';
import MoveIcon from '@rugo-vn/vue/dist/ionicons/MoveIcon.vue';

import { ref } from 'vue';
import { useAppStore } from '../stores/app';

// const nodes = ref({});
const appStore = useAppStore();
const contents = ref([]);
const currentContent = ref(null);

// const configs = ref({
//   roots: [],
//   keyboardNavigation: true,
//   dragAndDrop: true,
//   checkboxes: false,
//   editable: true,
//   disabled: false,
// });

const addContent = async () => {
  const name = prompt('Enter your content name: ');

  if (!name) return;

  await appStore.createContent(name);
  await loadContents();
  // const item = {
  //   id: uniqid(),
  //   text: 'New content',
  //   children: [],
  // };
  // nodes.value[item.id] = item;
  // configs.value.roots.unshift(item.id);
};

// const removeContent = (id) => {
//   for (const nodeId in nodes.value) {
//     const currentNode = nodes.value[nodeId];
//     currentNode.children = (currentNode.children || []).filter(
//       (nid) => nid !== id
//     );
//   }

//   delete nodes.value[id];
//   configs.value.roots = configs.value.roots.filter((nid) => nid !== id);
// };

// const createDelayCall = () => {
//   let timeout;
//   let lastArgs;

//   return (fn, now = false, ...args) => {
//     if (now && timeout) {
//       fn(...(args.length ? args : lastArgs));
//       clearTimeout(timeout);
//       return;
//     }

//     clearTimeout(timeout);
//     lastArgs = args;

//     timeout = setTimeout(() => {
//       clearTimeout(timeout);
//       fn(...args);
//     }, 500);
//   };
// };

// const delayCall = createDelayCall();

// const handleChange = () => {
//   console.log(`Contents changed`);
// };

const loadContents = async () => {
  contents.value = await appStore.loadContents();
};

const getContents = (node) => {
  return contents.value.filter((cnt) => cnt.parent === (node?.id || undefined));
};

const markContent = (cnt) => {
  currentContent.value = cnt;
};

const moveCurrentContentTo = async (cnt) => {
  await appStore.updateContent(currentContent.value.id, { parent: cnt.id });
  await loadContents();

  currentContent.value = null;
};

const handleContent = (cnt, handleFn, clickFn) => {
  clickFn();
  handleFn(cnt);
};

loadContents();

// watch(
//   () => [nodes, configs],
//   () => delayCall(handleChange, false),
//   { deep: true }
// );
</script>

<template>
  <div class="flex px-4">
    <RPanel class="w-1/2 max-w-md mt-6 relative">
      <RButton
        variant="primary"
        @click="addContent"
        class="px-0 py-0 justify-center w-12 h-12 rounded-full absolute -top-6 -right-6"
      >
        <AddIcon class="text-3xl" />
      </RButton>

      <RTree
        v-for="cnt in getContents()"
        :node="cnt"
        :key="cnt.id"
        :load="(node) => getContents(node)"
      >
        <template #ending="{ isShowed, toggleNode, node }">
          <RButton
            v-if="node === currentContent"
            variant="secondary"
            class="px-0 py-0 w-6 h-6 rounded-md items-center justify-center"
            @click="currentContent = null"
          >
            <MoveIcon />
          </RButton>

          <RButton
            v-else-if="currentContent"
            variant="info"
            class="px-0 py-0 w-6 h-6 rounded-md items-center justify-center"
            @click="moveCurrentContentTo(node)"
          >
            <CheckmarkIcon />
          </RButton>

          <RButton
            :variant="isShowed ? 'secondary' : 'primary'"
            class="px-0 py-0 w-6 h-6 rounded-md items-center justify-center ml-2"
            @click="toggleNode()"
          >
            <EyeIcon v-if="!isShowed" />
            <EyeOffIcon v-else />
          </RButton>

          <RDropdown :enableHover="true" boxAlign="right">
            <template #open>
              <RButton
                variant="primary"
                class="px-0 py-0 w-6 h-6 rounded-md items-center justify-center ml-2"
              >
                <CaretForwardIcon />
              </RButton>
            </template>

            <template v-slot="{ click }">
              <RButton
                variant="none"
                class="rounded-none w-32 text-left hover:bg-primary-100 text-xs"
                @click="handleContent(node, () => {}, click)"
                >Chuyển lên</RButton
              >
              <RButton
                variant="none"
                class="rounded-none w-32 text-left hover:bg-primary-100 text-xs"
                @click="handleContent(node, () => {}, click)"
                >Chuyển xuống</RButton
              >
              <RButton
                variant="none"
                class="rounded-none w-32 text-left hover:bg-primary-100 text-xs"
                @click="handleContent(node, markContent, click)"
                >Chọn</RButton
              >
              <RButton
                variant="none"
                class="rounded-none w-32 text-left hover:bg-primary-100 text-xs"
                @click="handleContent(node, () => {}, click)"
                >Chuyển ra</RButton
              >
              <RButton
                variant="none"
                class="rounded-none w-32 text-left hover:bg-warn-100 text-xs"
                @click="handleContent(node, () => {}, click)"
                >Sửa</RButton
              >
              <RButton
                variant="none"
                class="rounded-none w-32 text-left hover:bg-danger-100 text-xs"
                @click="handleContent(node, () => {}, click)"
                >Xóa</RButton
              >
            </template>
          </RDropdown>
        </template>
      </RTree>

      <!-- <Tree :nodes="nodes" :config="configs">
        <template #after-input="{ node }">
          <RButton
            variant="danger"
            class="text-xs px-1 py-1 ml-auto rounded"
            @click="removeContent(node.id)"
          >
            <TrashIcon />
          </RButton>
        </template>
      </Tree> -->
    </RPanel>
  </div>
</template>
