import { defineStore } from 'pinia';
import { reactive } from 'vue';

const NOTICE_TIMEOUT = 2000;

export const useNoticeStore = defineStore('notice', () => {
  let currentNoticeId = 0;

  const data = reactive([]);

  const push = (type, title, detail) => {
    data.push({
      id: ++currentNoticeId,
      type,
      title,
      detail,
      at: new Date(),
    });
  };

  setInterval(() => {
    const now = Date.now();

    do {
      let notice = data[0];
      if (!notice) break;

      if (now - notice.at > NOTICE_TIMEOUT) data.shift();
      else break;
    } while (data.length > 0);
  }, 100);

  return { data, push };
});
