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
import PencilIcon from '@rugo-vn/vue/dist/ionicons/PencilIcon.vue';
import EventEditor from '../components/EventEditor.vue';

const appStore = useAppStore();
const contents = ref([]);
const currentContent = ref(null);
const displayContent = ref(null);
const tzEvents = ref([]);
const currentEventId = ref(null);

const addContent = async () => {
  const name = prompt('Enter your content name: ');

  if (!name) return;

  await appStore.createContent(name);
  await loadContents();
};

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

const loadNotes = async () => {
  tzEvents.value = await appStore.loadEventsByContent(displayContent.value.id);
};

const showNotes = (cnt) => {
  displayContent.value = cnt;
  loadNotes();
};

loadContents();

// watch(
//   () => [nodes, configs],
//   () => delayCall(handleChange, false),
//   { deep: true }
// );
</script>

<template>
  <EventEditor
    v-if="currentEventId"
    :id="currentEventId"
    @close="
      {
        currentEventId = null;
        loadNotes();
      }
    "
  />

  <div class="flex px-4 items-start">
    <RPanel class="w-1/2 lg:w-1/3 xl:w-1/4 mt-4 sticky top-24">
      <RButton
        variant="primary"
        @click="addContent"
        class="px-0 py-0 justify-center w-8 h-8 rounded-full absolute -top-4 left-6"
      >
        <AddIcon class="text-3xl" />
      </RButton>

      <RTree
        v-for="cnt in getContents()"
        :node="cnt"
        :key="cnt.id"
        :load="(node) => getContents(node)"
        @clickNode="showNotes"
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

    <RPanel class="ml-4 w-1/2 lg:w-2/3 xl:w-3/4 mt-4 min-h-[100vh]">
      <div
        v-for="tzEvent of tzEvents"
        :key="tzEvent.id"
        class="mb-2 pb-2 border-b border-dashed relative"
      >
        <RButton
          class="px-0 py-0 w-8 h-8 justify-center absolute top-2 right-2"
          variant="primary"
          @click="currentEventId = tzEvent.id"
        >
          <PencilIcon class="text-lg" />
        </RButton>
        <div class="note-content" v-html="tzEvent.note"></div>
      </div>
    </RPanel>
  </div>
</template>
