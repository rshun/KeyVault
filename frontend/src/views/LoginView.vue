<script setup>
import { ref, defineEmits } from 'vue';
import RegisterView from './RegisterView.vue';

const emit = defineEmits(['login-success']);

const username = ref('');
const profilePassword = ref('');
const password = ref('');
const message = ref(''); // 重命名，使其更通用
const messageType = ref('error'); // 'success' 或 'error'

const showRegisterView = ref(false);
const isProfilePasswordVisible = ref(false);
const isMainPasswordVisible = ref(false);

const toggleProfilePasswordVisibility = () => { isProfilePasswordVisible.value = !isProfilePasswordVisible.value; };
const toggleMainPasswordVisibility = () => { isMainPasswordVisible.value = !isMainPasswordVisible.value; };

const handleRegisterClick = () => {
  message.value = ''; // 切换视图时清空消息
  showRegisterView.value = true;
};

// 新增点1: 处理注册成功事件的函数
const handleRegistrationSuccess = (successMessage) => {
  messageType.value = 'success';
  message.value = successMessage;
  showRegisterView.value = false; // 返回登录视图

   // **新增代码：清空所有输入框**
  username.value = '';
  profilePassword.value = '';
  password.value = '';
};

const handleLogin = async () => {
  message.value = '';
  if (!username.value || !profilePassword.value || !password.value) {
    messageType.value = 'error';
    message.value = '所有密码框都必须填写！';
    return;
  }
  const loginRequestBody = { username: username.value, configPassword: profilePassword.value };
  try {
    const loginResponse = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginRequestBody),
    });
    const loginData = await loginResponse.json();
    if (loginResponse.ok && loginData.success) {
      emit('login-success', {
        token: loginData.token,
        configPassword: profilePassword.value,
        mainPassword: password.value
      });
    } else {
      messageType.value = 'error';
      message.value = loginData.message || '登录失败，请检查您的凭据。';
    }
  } catch (error) {
    messageType.value = 'error';
    message.value = '无法连接到服务器。';
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-left">
      <div class="logo">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 11H7C5.89543 11 5 11.8954 5 13V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V13C19 11.8954 18.1046 11 17 11Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 11V7C12 5.67392 11.4732 4.40215 10.5355 3.46447C9.59785 2.52678 8.32608 2 7 2C4.34783 2 3 4.23858 3 7V7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h1>KeyVault</h1>
      </div>
    </div>

    <RegisterView 
      v-if="showRegisterView" 
      @back="showRegisterView = false"
      @register-success="handleRegistrationSuccess" 
    />
    
    <div v-else class="login-right">
      <div class="login-form-wrapper">
        <div class="form-header">
          <h2>欢迎回来！</h2>
          <p>请输入您的凭据以继续</p>
        </div>
        <form class="login-form" @submit.prevent="handleLogin">
          
          <div v-if="message" class="message" :class="messageType">
              {{ message }}
          </div>

          <div class="input-group">
              <label for="username">用户名</label>
              <input ref="usernameInput" type="text" id="username" name="username" v-model="username" required>
          </div>
          <div class="input-group">
              <label for="profilePassword">配置文件密码</label>
              <div class="password-input-wrapper">
              <input 
                  id="profilePassword" 
                  :type="isProfilePasswordVisible ? 'text' : 'password'"
                  v-model="profilePassword" 
                  required
              >
              <span class="toggle-password" @click="toggleProfilePasswordVisibility">
                  <svg v-if="!isProfilePasswordVisible" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              </span>
              </div>
          </div>
          <div class="input-group">
              <label for="password">主密码</label>
              <div class="password-input-wrapper">
              <input 
                  id="password" 
                  :type="isMainPasswordVisible ? 'text' : 'password'"
                  v-model="password" 
                  required
              >
              <span class="toggle-password" @click="toggleMainPasswordVisibility">
                  <svg v-if="!isMainPasswordVisible" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              </span>
              </div>
          </div>
          <div class="button-group">
              <button type="submit" class="login-button">登录</button>
              <button type="button" @click="handleRegisterClick" class="register-button">注册</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 样式与之前相同，但为消息框添加了 success 样式 */
.message { padding: 1rem; margin-bottom: 1.5rem; border: 1px solid transparent; border-radius: .25rem; text-align: center; font-size: 14px; }
.message.success { color: #155724; background-color: #d4edda; border-color: #c3e6cb; }
.message.error { color: #842029; background-color: #f8d7da; border-color: #f5c2c7; }
.login-container { display: flex; width: 100vw; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f0f2f5; }
.login-left { flex: 2; background-color: #007aff; color: white; display: flex; justify-content: center; align-items: center; text-align: center; padding: 40px; }
.logo h1 { margin-top: 1rem; font-weight: 600; letter-spacing: 1px; }
.login-right { flex: 3; display: flex; justify-content: center; align-items: center; padding: 40px; }
.login-form-wrapper { max-width: 400px; width: 100%; }
.form-header { text-align: center; margin-bottom: 2.5rem; }
.form-header h2 { font-size: 28px; margin-bottom: 0.5rem; color: #1d2b3a; }
.form-header p { color: #6c757d; font-size: 16px; }
.input-group { margin-bottom: 1.5rem; }
.input-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #333; }
.input-group input { width: 100%; padding: 12px 15px; border: 1px solid #ccc; border-radius: 8px; font-size: 16px; box-sizing: border-box; transition: all 0.2s ease-in-out; }
.input-group input:focus { outline: none; border-color: #007aff; box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2); }
.password-input-wrapper { position: relative; display: flex; align-items: center; }
.password-input-wrapper input { padding-right: 50px; }
.toggle-password { position: absolute; right: 15px; cursor: pointer; color: #999; display: flex; align-items: center; height: 100%; }
.toggle-password:hover { color: #333; }
.button-group { display: flex; gap: 1rem; margin-top: 2rem;}
.login-button, .register-button { flex-grow: 1; padding: 14px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.2s ease-in-out; }
.login-button { background-color: #007aff; color: white; }
.login-button:hover { background-color: #0056b3; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2); }
.register-button { background-color: #e9ecef; color: #495057; }
.register-button:hover { background-color: #dbe1e6; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
@media (max-width: 768px) {
  .login-left { display: none; }
  .login-right { flex: 1; }
}
</style>