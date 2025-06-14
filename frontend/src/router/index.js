// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MainView from '../views/MainView.vue'

// 新增一个变量来标记用户是否刚刚登录
let isJustLoggedIn = false;

export function setLoginStatus(status) {
  isJustLoggedIn = status;
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/', 
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true } // 只有未登录时可见
    },
    { 
      path: '/main', 
      name: 'main',
      component: MainView, 
      meta: { requiresAuth: true } // 需要登录
    }
  ]
})

router.beforeEach((to, from, next) => {
  // 使用 sessionStorage 获取认证信息
  const isAuthenticated = !!sessionStorage.getItem('authToken');

  // 当用户成功登录并跳转到主页时，isJustLoggedIn 会是 true
  if (to.name === 'main' && from.name === 'login' && isJustLoggedIn) {
    // 这是合法的跳转，放行，并重置标志位
    isJustLoggedIn = false; 
    next();
    return;
  }

  // 如果目标路由需要认证
  if (to.meta.requiresAuth) {
    // 但用户没有认证信息（例如直接输入URL、刷新页面、或者会话已关闭）
    if (!isAuthenticated) {
      next({ name: 'login' }); // 强制跳转到登录页
    } else {
      next(); // 如果有认证信息（例如在同一会话内刷新），则放行
    }
  } 
  // 如果目标路由是登录页，但用户已经认证了
  else if (to.meta.requiresGuest && isAuthenticated) {
    next({ name: 'main' }); // 直接跳转到主页
  } 
  // 其他所有情况
  else {
    next(); // 正常放行
  }
});

export default router