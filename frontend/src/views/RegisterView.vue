<script setup>
import { ref, defineEmits, onMounted, nextTick } from 'vue';

const emit = defineEmits(['back']);

const username = ref('');
const password = ref('');
// 'path' ref 现在用于存储和显示选择的路径
const path = ref('');
const successMessage = ref('');
const usernameInput = ref(null); // 用于自动聚焦

// 组件挂载后，自动聚焦到第一个输入框
onMounted(() => {
  nextTick(() => {
    usernameInput.value?.focus();
  });
});

const handleRegister = () => {
  if (!username.value || !password.value || !path.value) {
    successMessage.value = '错误：用户名、密码和路径都不能为空！';
    return;
  }
  // 实际的注册逻辑可以放在这里，现在只显示成功
  successMessage.value = `注册成功！数据库将保存至：${path.value}`;
};

const goBack = () => {
  emit('back');
};

// 调用预加载脚本暴露的 API
const selectPath = async () => {
  // 检查 API 是否存在
  if (window.electronAPI && typeof window.electronAPI.showSaveDialog === 'function') {
    const selectedPath = await window.electronAPI.showSaveDialog();
    if (selectedPath) {
      path.value = selectedPath;
    }
  } else {
    console.error('electronAPI.showSaveDialog is not available!');
    successMessage.value = '错误：无法调用文件选择功能。';
  }
};
</script>

<template>
  <div class="login-right">
    <div class="login-form-wrapper">
      <div class="form-header">
        <h2>创建新账户</h2>
        <p>请填写您的注册信息</p>
      </div>
      <form class="login-form" @submit.prevent="handleRegister">
        
        <div v-if="successMessage" class="message" :class="{ 'error': successMessage.includes('错误') }">
            {{ successMessage }}
        </div>

        <div class="input-group">
            <label for="reg-username">用户名</label>
            <input id="reg-username" type="text" v-model="username" required ref="usernameInput">
        </div>
        <div class="input-group">
            <label for="reg-password">密码</label>
            <input id="reg-password" type="password" v-model="password" required>
        </div>
        
        <div class="input-group horizontal-group">
            <div class="path-selection-group">
              <input id="reg-path" type="text" v-model="path" required readonly placeholder="点击右侧按钮选择...">
              <button type="button" @click="selectPath" class="browse-button">数据文件路径</button>
            </div>
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
  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid transparent;
  border-radius: .25rem;
  text-align: center;
  font-size: 14px;
}
.message.error {
    color: #842029;
    background-color: #f8d7da;
    border-color: #f5c2c7;
}

/* **修改点**: 新增 horizontal-group 样式用于水平布局 */
.horizontal-group {
  display: flex;
  align-items: center;
  gap: 10px; /* 在标签和输入框之间增加一些间距 */
}
.horizontal-group label {
  margin-bottom: 0; /* 移除 flex 项的下外边距 */
  flex-shrink: 0; /* 防止标签文字收缩 */
}
.horizontal-group .path-selection-group {
  flex-grow: 1; /* 让路径选择部分占据剩余空间 */
}

/* 路径选择组的样式 */
.path-selection-group {
  display: flex;
  align-items: center;
}
.path-selection-group input {
  flex-grow: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}
.browse-button {
  padding: 12px 15px;
  border: 1px solid #ccc;
  background-color: #f8f9fa;
  cursor: pointer;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  transition: background-color 0.2s;
  flex-shrink: 0; /* 防止按钮收缩 */
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