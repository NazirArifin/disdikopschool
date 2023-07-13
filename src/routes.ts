import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import Session from './helpers/session';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/', name: 'Front', component: () => import('./views/Front.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/home', name: 'Home', component: () => import('./views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/home2', name: 'Home2', component: () => import('./views/Home2.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth) {
    if (Session.getToken()) {
      next();
    } else {
      next({ name: 'Front' });
    }
  } else {
    next();
  }
});

export default router;