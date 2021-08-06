import Session from '@/helpers/session'
import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Front from '../views/Front.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/', name: 'Front', component: Front, meta: { requiresAuth: false }
  },
  {
    path: '/home', name: 'Home', meta: { requiresAuth: true },
    component: () => import(/* webpackChunkName: "home" */ '../views/Home/Home.vue')
  },
  {
    path: '/home2', name: 'Home2', meta: { requiresAuth: true },
    component: () => import(/* webpackChunkName: "home2" */ '../views/Home2.vue')
  }
]

const router = new VueRouter({
  mode: process.env.IS_ELECTRON ? 'hash' : 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta!.requiresAuth) {
    if (Session.getToken()) {
      next();
    } else {
      next({ name: 'Front' });
    }
  } else {
    next();
  }
});

export default router
