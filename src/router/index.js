import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '首页概览' } },
      { path: 'books', name: 'BookList', component: () => import('@/views/BookList.vue'), meta: { title: '图书管理' } },
      { path: 'borrow', name: 'BorrowManage', component: () => import('@/views/BorrowManage.vue'), meta: { title: '借阅管理' } },
      { path: 'about', name: 'About', component: () => import('@/views/About.vue'), meta: { title: '技术说明' } },
      { path: 'profile', name: 'Profile', component: () => import('@/views/Profile.vue'), meta: { title: '个人资料' } }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 全局前置守卫：未登录访问内页 -> 登录页；已登录访问登录页 -> 首页
router.beforeEach((to) => {
  let logged = false
  try {
    logged = !!JSON.parse(localStorage.getItem('bms_user_v1') || '{}').token
  } catch (e) {
    logged = false
  }
  if (!to.meta.public && !logged) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/login' && logged) {
    return { path: '/dashboard' }
  }
  return true
})

export default router
