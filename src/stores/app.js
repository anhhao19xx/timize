import { defineStore } from 'pinia';
import { clone, equals } from 'ramda';
import { reactive, ref } from 'vue';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import {
  API_EMAIL,
  API_PASSWORD,
  API_TOKEN,
  EVENT_STORAGE,
  INFO_LAST_LOAD,
  INFO_LAST_SAVE,
} from '../constants';
import { useNoticeStore } from './notice';

const validateStatus = (status) => status >= 200 && status < 500;

export const useAppStore = defineStore('app', () => {
  const notice = useNoticeStore();

  let saveTime = +new Date(parseInt(localStorage.getItem(INFO_LAST_SAVE) || 0));
  let loadTime = +new Date(parseInt(localStorage.getItem(INFO_LAST_LOAD) || 0));

  const events = reactive(
    JSON.parse(localStorage.getItem(EVENT_STORAGE) || '[]')
  );

  const isNotUpToDate = ref(true);
  const isChanged = ref(saveTime >= loadTime);

  let token = localStorage.getItem(API_TOKEN) || '';
  let currentEventId = events.reduce(
    (lastId, event) => (event.id > lastId ? event.id : lastId),
    0
  );

  const user = reactive({
    email: localStorage.getItem(API_EMAIL),
    password: localStorage.getItem(API_PASSWORD),
  });

  // methods
  const createHttp = () =>
    axios.create({
      baseURL: import.meta.env.TIMIZE_API,
      validateStatus,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });

  const save = () => {
    localStorage.setItem(EVENT_STORAGE, JSON.stringify(events));

    saveTime = +new Date();
    isChanged.value = true;

    localStorage.setItem(INFO_LAST_SAVE, saveTime);
  };

  const addEvent = (payload) => {
    const now = new Date().toISOString();

    events.push({
      id: ++currentEventId,
      ...payload,
      createdAt: now,
      updatedAt: now,
    });

    save();

    notice.push(
      'success',
      'Success',
      `The event "${payload.title}" was added!`
    );
  };

  const updateEvent = (payload) => {
    let isChanged = false;

    for (const event of events) {
      if (payload.id === event.id) {
        const prevEvent = clone(event);
        delete payload.id;
        delete payload.createdAt;
        for (let key in payload) event[key] = payload[key];
        if (!equals(prevEvent, event)) {
          isChanged = true;
          event.updatedAt = new Date().toISOString();
        }
        break;
      }
    }

    if (!isChanged) return false;

    save();
    notice.push(
      'success',
      'Success',
      `The event "${payload.title}" was updated!`
    );

    return true;
  };

  const deleteEvent = (payload) => {
    for (let i = 0; i < events.length; i++) {
      if (events[i].id === payload.id) {
        events.splice(i, 1);
        break;
      }
    }

    save();
    notice.push(
      'success',
      'Success',
      `The event "${payload.title}" was deleted!`
    );
  };

  const tryLogin = async () => {
    if (token) return true;

    const http = createHttp();

    const res = await http.post('/api/login', {
      ...user,
    });

    if (res.status !== 200) {
      notice.push('danger', res.data?.error?.title, res.data?.error?.detail);
      return false;
    }

    token = res.data.token;

    localStorage.setItem(API_TOKEN, token);
    localStorage.setItem(API_EMAIL, user.email);
    localStorage.setItem(API_PASSWORD, user.password);

    return true;
  };

  const getUserInfo = async () => {
    const http = createHttp();
    const res = await http.get('/api/info');
    return res.data.user;
  };

  const getBatchNumber = (d) =>
    Math.floor((+new Date(d) / 1000 / 60 / 60 / 24 - 3) / 7);

  const syncLoadAndSave = () => {
    localStorage.setItem(INFO_LAST_LOAD, saveTime);
    loadTime = saveTime;

    isChanged.value = false;
    isNotUpToDate.value = false;
  };

  const encrypt = (text) => {
    return CryptoJS.AES.encrypt(
      text,
      localStorage.getItem(API_PASSWORD)
    ).toString();
  };

  const decrypt = (text) => {
    return CryptoJS.AES.decrypt(
      text,
      localStorage.getItem(API_PASSWORD)
    ).toString(CryptoJS.enc.Utf8);
  };

  const saveToCloud = async () => {
    if (!(await tryLogin())) return;

    const userInfo = await getUserInfo();
    const http = createHttp();
    const batches = {};
    let count = 0;

    for (const event of events) {
      const batch = getBatchNumber(event.from);

      batches[batch] ||= {
        user: userInfo.id,
        batch,
        data: [],
      };

      batches[batch].data.push(event);
    }

    for (const no in batches) {
      const item = batches[no];
      item.data = encrypt(JSON.stringify(item.data));

      const res = await http.get(
        `/api/tables/buckets?filters[user]=${item.user}&filters[batch]=${item.batch}`
      );

      if (res.status !== 200) {
        notice.push('danger', res.data?.error?.title, res.data?.error?.detail);
        continue;
      }

      let nextRes;
      if (res.data.meta.total === 0) {
        nextRes = await http.post(`/api/tables/buckets`, item);
      } else {
        nextRes = await http.patch(
          `/api/tables/buckets/${res.data.data[0].id}`,
          { set: item }
        );
      }

      if (nextRes.status === 200) count++;
      else
        notice.push(
          'danger',
          nextRes.data?.error?.title,
          nextRes.data?.error?.detail
        );
    }

    syncLoadAndSave();

    notice.push(
      'success',
      `Save successful`,
      `You saved ${count}/${Object.keys(batches).length} item(s).`
    );
  };

  const loadFromCloud = async () => {
    if (!(await tryLogin())) return;

    const userInfo = await getUserInfo();
    const http = createHttp();

    const res = await http.get(
      `/api/tables/buckets?filters[user]=${userInfo.id}&limit=-1`
    );

    if (res.status !== 200) {
      notice.push('danger', res.data?.error?.title, res.data?.error?.detail);
      return false;
    }

    while (events.length) events.shift();

    for (const item of res.data.data) {
      const batchEvents = JSON.parse(decrypt(item.data));
      for (const batchEvent of batchEvents) events.push(batchEvent);
    }

    save();

    syncLoadAndSave();

    notice.push(
      'success',
      `Load successful`,
      `You loaded ${events.length} event(s).`
    );
  };

  return {
    isNotUpToDate,
    isChanged,
    notice,
    events,
    user,
    addEvent,
    updateEvent,
    deleteEvent,
    saveToCloud,
    loadFromCloud,
  };
});
