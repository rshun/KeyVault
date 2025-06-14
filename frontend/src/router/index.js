// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MainView from '../views/MainView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/', 
      component: LoginView,
      meta: { requiresGuest: true } // 只有未登录时可见
    },
    { 
      path: '/main', 
      component: MainView, 
      meta: { requiresAuth: true } // 需要登录
    }
  ]
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('authToken')
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/') // 需要登录但未登录 -> 跳转到登录页
  } else if (to.meta.requiresGuest && isAuthenticated) {
    next('/main') // 已登录但访问登录页 -> 跳转到主页
  } else {
    next() // 正常放行
  }
})

export default router
