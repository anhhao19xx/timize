import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'calendar',
      component: () => import('../views/CalendarView.vue'),
    },

    {
      path: '/notes',
      name: 'notes',
      component: () => import('../views/NoteListView.vue'),
    },
  ],
});

export default router;
