<script setup>
import { ref, onMounted } from 'vue';
import LoginView from './views/LoginView.vue';
import MainView from './views/MainView.vue';
import SetupView from './views/SetupView.vue'; // 确认此文件存在

// 定义应用状态
const AppState = {
  LOADING: 'loading',
  SETUP: 'setup',
  LOGIN: 'login',
  MAIN: 'main',
};

const currentState = ref(AppState.LOADING);
const userInfo = ref([]);
const authToken = ref('');
const configPassword = ref('');
const mainPassword = ref('');
// 新增一个错误消息状态
const dataError = ref('');

onMounted(async () => {
  // 确认您有 SetupView.vue, 如果没有，请先简化这里的逻辑
  if (window.electronAPI) {
    const workspacePath = await window.electronAPI.getWorkspacePath();
    if (!workspacePath) {
      currentState.value = AppState.SETUP;
      return;
    }
  }

  const storedToken = sessionStorage.getItem('authToken');
  const storedConfigPwd = sessionStorage.getItem('configPassword');
  const storedMainPwd = sessionStorage.getItem('mainPassword');

  if (storedToken && storedConfigPwd && storedMainPwd) {
    console.log("检测到已保存的登录状态，正在自动登录...");
    handleLoginSuccess({
      token: storedToken,
      configPassword: storedConfigPwd,
      mainPassword: storedMainPwd
    });
  } else {
    currentState.value = AppState.LOGIN;
  }
});

// **修改后的 fetchData 函数**
const fetchData = async (token) => {
  dataError.value = ''; // 重置错误
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
        // **修改点：不再调用 handleLogout()，而是设置错误信息**
        console.error("获取数据失败: " + data.message);
        dataError.value = `获取数据失败，请检查主密码是否正确。(${data.message})`;
    }
  } catch (error) {
     // **修改点：不再调用 handleLogout()**
     console.error("获取数据时发生网络错误", error);
     dataError.value = '获取数据时发生网络错误，请检查后端服务。';
  }
};

const handleLoginSuccess = (credentials) => {
  sessionStorage.setItem('authToken', credentials.token);
  sessionStorage.setItem('configPassword', credentials.configPassword);
  sessionStorage.setItem('mainPassword', credentials.mainPassword);

  authToken.value = credentials.token;
  configPassword.value = credentials.configPassword;
  mainPassword.value = credentials.mainPassword;
  
  // 切换到主视图
  currentState.value = AppState.MAIN;
  
  fetchData(credentials.token);
};

const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('configPassword');
    sessionStorage.removeItem('mainPassword');

    authToken.value = '';
    configPassword.value = '';
    mainPassword.value = '';
    userInfo.value = [];
    dataError.value = ''; // 清除错误信息
    
    currentState.value = AppState.LOGIN;
};
</script>

<template>
  <div v-if="currentState === AppState.LOADING">加载中...</div>
  <SetupView v-else-if="currentState === AppState.SETUP" />
  <LoginView v-else-if="currentState === AppState.LOGIN" @login-success="handleLoginSuccess" />
  <MainView 
    v-else-if="currentState === AppState.MAIN"
    :password-data="userInfo"
    :auth-token="authToken"
    :config-password="configPassword"
    :main-password="mainPassword"
    :error-message="dataError"
    @logout="handleLogout"
  />
</template>

<style>
body { margin: 0; padding: 0; box-sizing: border-box; }
</style>