<script setup>
import { ref, onMounted } from 'vue';
import LoginView from './views/LoginView.vue';
import MainView from './views/MainView.vue';

const isLoggedIn = ref(false);
const userInfo = ref([]);
const authToken = ref('');
const configPassword = ref('');
const mainPassword = ref('');

// 组件加载时执行的生命周期钩子
onMounted(() => {
  // 检查浏览器中是否已保存登录凭据
  const storedToken = localStorage.getItem('authToken');
  const storedConfigPwd = localStorage.getItem('configPassword');
  const storedMainPwd = localStorage.getItem('mainPassword');

  // 如果凭据都存在，则自动登录
  if (storedToken && storedConfigPwd && storedMainPwd) {
    console.log("检测到已保存的登录状态，正在自动登录...");
    handleLoginSuccess({
      token: storedToken,
      configPassword: storedConfigPwd,
      mainPassword: storedMainPwd
    });
  }
});

// 获取数据的函数
const fetchData = async (token) => {
  try {
    const response = await fetch('http://localhost:3000/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        configPassword: configPassword.value,
        mainPassword: mainPassword.value
      })
    });
    const data = await response.json();
    if (data.success) {
        userInfo.value = data.data;
    } else {
        alert("获取数据失败: " + data.message);
        handleLogout(); // 如果获取数据失败（例如token过期），则自动登出
    }
  } catch (error) {
     alert("获取数据时发生网络错误");
     handleLogout();
  }
};

// 登录成功后的处理函数
const handleLoginSuccess = (credentials) => {
  // 1. 保存凭据到浏览器的 localStorage
  localStorage.setItem('authToken', credentials.token);
  localStorage.setItem('configPassword', credentials.configPassword);
  localStorage.setItem('mainPassword', credentials.mainPassword);

  // 2. 更新组件状态
  authToken.value = credentials.token;
  configPassword.value = credentials.configPassword;
  mainPassword.value = credentials.mainPassword;
  
  // 3. 设置为已登录状态，显示主页面
  isLoggedIn.value = true;
  
  // 4. 在后台获取数据
  fetchData(credentials.token);
};

// 新增：登出函数
const handleLogout = () => {
    // 1. 清除浏览器中保存的所有凭据
    localStorage.removeItem('authToken');
    localStorage.removeItem('configPassword');
    localStorage.removeItem('mainPassword');

    // 2. 刷新页面，这将自动返回到登录页
    window.location.reload();
};
</script>

<template>
  <!-- 监听子组件发出的 logout 事件 -->
  <LoginView v-if="!isLoggedIn" @login-success="handleLoginSuccess" />
  
  <MainView 
    v-else 
    :password-data="userInfo"
    :auth-token="authToken"
    :config-password="configPassword"
    :main-password="mainPassword"
    @logout="handleLogout"
  />
</template>

<style>
body { margin: 0; padding: 0; box-sizing: border-box; }
</style>
