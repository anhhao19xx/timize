import { defineStore } from 'pinia';
import { clone, equals } from 'ramda';
import { reactive } from 'vue';
import { EVENT_STORAGE } from '../constants';
import { useNoticeStore } from './notice';

export const useAppStore = defineStore('app', () => {
  const notice = useNoticeStore();

  const events = reactive(
    JSON.parse(localStorage.getItem(EVENT_STORAGE) || '[]')
  );

  let currentEventId = events.reduce(
    (lastId, event) => (event.id > lastId ? event.id : lastId),
    0
  );

  const save = () => {
    localStorage.setItem(EVENT_STORAGE, JSON.stringify(events));
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

  return { notice, events, addEvent, updateEvent, deleteEvent };
});
