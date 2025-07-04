<script setup>
import { ref, defineEmits, onMounted, nextTick } from 'vue';

const emit = defineEmits(['back', 'register-success']);

const username = ref('');
const password = ref('');
// 移除了 path ref
const message = ref('');
const messageType = ref('success');
const usernameInput = ref(null);

onMounted(() => {
  nextTick(() => {
    usernameInput.value?.focus();
  });
});

const handleRegister = async () => {
  message.value = '';
  // 移除了对 path 的检查
  if (!username.value || !password.value) {
    messageType.value = 'error';
    message.value = '错误：用户名和密码都不能为空！';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
        // 不再发送 path
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      emit('register-success', result.message);
    } else {
      messageType.value = 'error';
      message.value = result.message || '发生未知错误，请重试。';
    }
  } catch (error) {
    console.error('注册请求失败:', error);
    messageType.value = 'error';
    message.value = '无法连接到服务器，请检查后端服务是否正在运行。';
  }
};

const goBack = () => {
  emit('back');
};

// 移除了 selectPath 函数
</script>

<template>
  <div class="login-right">
    <div class="login-form-wrapper">
      <div class="form-header">
        <h2>创建新账户</h2>
        <p>请填写您的注册信息</p>
      </div>
      <form class="login-form" @submit.prevent="handleRegister">
        
        <div v-if="message" class="message" :class="messageType">
            {{ message }}
        </div>

        <div class="input-group">
            <label for="reg-username">用户名</label>
            <input id="reg-username" type="text" v-model="username" required ref="usernameInput">
        </div>
        <div class="input-group">
            <label for="reg-password">密码</label>
            <input id="reg-password" type="password" v-model="password" required>
        </div>
        
        <div class="button-group">
            <button type="submit" class="register-button">注册</button>
            <button type="button" @click="goBack" class="login-button">返回</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* 消息样式 */
.message {
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid transparent;
  border-radius: .25rem;
  text-align: center;
  font-size: 14px;
}
.message.success {
  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
}
.message.error {
    color: #842029;
    background-color: #f8d7da;
    border-color: #f5c2c7;
}

/* 水平布局样式 */
.horizontal-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.horizontal-group label {
  margin-bottom: 0;
  flex-shrink: 0;
}
.horizontal-group .path-selection-group {
  flex-grow: 1;
}

.path-selection-group {
  display: flex;
  align-items: center;
}

/* ***** 主要修改：调整输入框和按钮的边框圆角以适应新位置 ***** */
.path-selection-group input {
  flex-grow: 1;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  /* 移除 border-right: none，因为现在它在右边 */
}
.browse-button {
  padding: 12px 15px;
  border: 1px solid #ccc;
  background-color: #f8f9fa;
  cursor: pointer;
  /* 修改圆角，使其在左侧 */
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  /* 添加 border-right: none 以便和输入框连接 */
  border-right: none;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.browse-button:hover {
  background-color: #e2e6ea;
}

/* 沿用 LoginView 的样式 */
.login-right {
  flex: 3;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background-color: #f0f2f5;
  width: 100%;
  height: 100%;
}
.login-form-wrapper { max-width: 400px; width: 100%; }
.form-header { text-align: center; margin-bottom: 2.5rem; }
.form-header h2 { font-size: 28px; margin-bottom: 0.5rem; color: #1d2b3a; }
.form-header p { color: #6c757d; font-size: 16px; }
.input-group { margin-bottom: 1.5rem; }
.input-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #333; }
.input-group input { 
  width: 100%; padding: 12px 15px; border: 1px solid #ccc; 
  border-radius: 8px; font-size: 16px; box-sizing: border-box; 
  transition: all 0.2s ease-in-out; 
}
.input-group input:focus { 
  outline: none; border-color: #007aff; 
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2); 
}
.input-group input[readonly] {
  background-color: #e9ecef;
  cursor: default;
}

.button-group { display: flex; gap: 1rem; margin-top: 2rem;}
.login-button, .register-button { 
  flex-grow: 1; padding: 14px; border: none; border-radius: 8px; 
  font-size: 16px; font-weight: bold; cursor: pointer; 
  transition: all 0.2s ease-in-out; 
}
.login-button { background-color: #007aff; color: white; }
.login-button:hover { 
  background-color: #0056b3; transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
}
.register-button { background-color: #28a745; color: white; }
.register-button:hover { 
  background-color: #218838; transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>