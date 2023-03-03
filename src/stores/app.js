import { defineStore } from 'pinia';
import { clone, equals } from 'ramda';
import { reactive, ref } from 'vue';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { API_EMAIL, API_PASSWORD, API_TOKEN } from '../constants';
import { useNoticeStore } from './notice';

const validateStatus = (status) => status >= 200 && status < 500;

export const useAppStore = defineStore('app', () => {
  const notice = useNoticeStore();

  const events = reactive([]);
  const appToken = ref(localStorage.getItem(API_TOKEN) || '');
  const appPassword = ref(localStorage.getItem(API_PASSWORD) || '');

  if (!appPassword.value) appToken.value = '';

  const user = reactive({
    email: localStorage.getItem(API_EMAIL),
    password: localStorage.getItem(API_PASSWORD),
  });

  const view = ref('');

  // methods
  const createHttp = () =>
    axios.create({
      baseURL: import.meta.env.TIMIZE_API,
      validateStatus,
      headers: {
        ...(appToken.value
          ? { authorization: `Bearer ${appToken.value}` }
          : {}),
      },
    });

  const clearToken = () => {
    localStorage.removeItem(API_TOKEN);
    localStorage.removeItem(API_PASSWORD);
    appToken.value = '';
    appPassword.value = '';
  };

  const getUserInfo = async () => {
    const http = createHttp();
    const res = await http.get('/api/info');
    const { user } = handleResponse(res);
    return user;
  };

  const handleResponse = (res) => {
    if (res.status === 403) {
      clearToken();
    }

    if (res.data?.error?.title) {
      notice.push(
        'danger',
        res.data?.error?.title ||
          'Error occurs, please check console to more information',
        res.data?.error?.detail
      );
      throw new Error(res.data);
    }

    return res.data;
  };

  const encrypt = (data) => {
    return CryptoJS.AES.encrypt(
      JSON.stringify(data),
      appPassword.value
    ).toString();
  };

  const decrypt = (text) => {
    try {
      return JSON.parse(
        CryptoJS.AES.decrypt(text, appPassword.value).toString(
          CryptoJS.enc.Utf8
        )
      );
    } catch (err) {
      notice.push(
        'danger',
        'Invalid password',
        'Please re-login to get decrypt password'
      );
      clearToken();
    }
  };

  const serialize = (tzEvent) => ({
    id: tzEvent.id || null,
    user: tzEvent.user,
    from: tzEvent.from,
    to: tzEvent.to,
    data: encrypt({
      title: tzEvent.title,
      color: tzEvent.color,
      note: tzEvent.note,
      done: tzEvent.done,
    }),
  });

  const deserialize = (rawTzEvent) => {
    const data = decrypt(rawTzEvent.data);
    return {
      id: rawTzEvent.id,
      from: rawTzEvent.from,
      to: rawTzEvent.to,
      title: data.title,
      note: data.note,
      color: data.color,
      done: data.done,
    };
  };

  const save = async (tzEvent, isDelete = false) => {
    const http = createHttp();
    const userInfo = await getUserInfo();

    const item = serialize({
      ...tzEvent,
      user: userInfo.id,
    });

    let res;

    if (!tzEvent.id) {
      tzEvent = {
        data: tzEvent,
      };

      res = await http.post(`/api/tables/tzevents`, item);
    } else if (isDelete) {
      res = await http.delete(`/api/tables/tzevents/${tzEvent.id}`);
    } else {
      res = await http.patch(`/api/tables/tzevents/${tzEvent.id}`, {
        set: item,
      });
    }

    const rawTzEvent = handleResponse(res);

    if (!tzEvent.id) events.push(deserialize(rawTzEvent));
  };

  const addEvent = async (payload) => {
    const now = new Date().toISOString();
    const tzEvent = {
      ...payload,
      createdAt: now,
      updatedAt: now,
    };

    if (!(await save(tzEvent))) return false;

    notice.push(
      'success',
      'Success',
      `The event "${payload.title}" was added!`
    );
  };

  const updateEvent = (payload) => {
    let isChanged = false;
    let updatedTzEvent = null;

    for (const event of events) {
      if (payload.id === event.id) {
        const prevEvent = clone(event);
        delete payload.id;
        delete payload.createdAt;
        for (let key in payload) event[key] = payload[key];
        if (!equals(prevEvent, event)) {
          isChanged = true;
          event.updatedAt = new Date().toISOString();
          updatedTzEvent = event;
        }
        break;
      }
    }

    if (!isChanged) return false;

    save(updatedTzEvent);

    notice.push(
      'success',
      'Success',
      `The event "${payload.title}" was updated!`
    );

    return true;
  };

  const deleteEvent = (payload) => {
    let deletedTzEvent;

    for (let i = 0; i < events.length; i++) {
      if (events[i].id === payload.id) {
        deletedTzEvent = events.splice(i, 1)[0];
        break;
      }
    }

    save(deletedTzEvent, true);

    notice.push(
      'success',
      'Success',
      `The event "${payload.title}" was deleted!`
    );
  };

  const login = async ({ email, password }) => {
    const http = createHttp();

    const res = await http.post('/api/login', {
      email,
      password,
    });

    const { token: nextToken } = handleResponse(res);

    localStorage.setItem(API_TOKEN, nextToken);
    localStorage.setItem(API_EMAIL, email);
    localStorage.setItem(API_PASSWORD, password);

    appToken.value = nextToken;
    appPassword.value = password;

    notice.push('success', `Sign in successful`, '');
  };

  const loadEvents = async () => {
    const http = createHttp();
    const userInfo = await getUserInfo();

    const res = await http.get(
      `/api/tables/tzevents?filters[user]=${userInfo.id}&limit=-1`
    );

    const { data } = handleResponse(res);
    const nextEvents = data.map(deserialize);

    while (events.length) events.shift();
    for (const tzEvent of nextEvents) events.push(tzEvent);
  };

  return {
    token: appToken,
    view,
    notice,
    events,
    user,
    addEvent,
    updateEvent,
    deleteEvent,
    login,
    loadEvents,
  };
});
