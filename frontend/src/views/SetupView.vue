<script setup>
import { ref } from 'vue';

const emit = defineEmits(['setup-complete']);
const errorMessage = ref('');

async function createWorkspace() {
  errorMessage.value = '';
  try {
    const path = await window.electronAPI.createWorkspace();
    if (path) {
      // 已删除 alert 提示
      location.reload();
    }
  } catch (error) {
    errorMessage.value = '创建工作区失败: ' + error.message;
  }
}

async function openWorkspace() {
  errorMessage.value = '';
  try {
    const path = await window.electronAPI.openWorkspace();
    if (path) {
      // 已删除 alert 提示
      location.reload();
    }
  } catch (error) {
    errorMessage.value = '打开工作区失败: ' + error.message;
  }
}
</script>

<template>
  <div class="setup-container">
    <div class="setup-box">
      <div class="logo">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 11H7C5.89543 11 5 11.8954 5 13V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V13C19 11.8954 18.1046 11 17 11Z" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 11V7C12 5.67392 11.4732 4.40215 10.5355 3.46447C9.59785 2.52678 8.32608 2 7 2C4.34783 2 3 4.23858 3 7V7" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1>欢迎使用 KeyVault</h1>
      <p class="subtitle">为了开始使用和同步数据，请设置您的工作区。</p>
      
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div class="button-group">
        <button @click="createWorkspace" class="action-button create">
          <span class="btn-title">创建新工作区</span>
          <span class="btn-desc">为您的所有设备首次设置 KeyVault。</span>
        </button>
        <button @click="openWorkspace" class="action-button open">
          <span class="btn-title">打开现有工作区</span>
          <span class="btn-desc">连接到您在其他设备上已创建的工作区。</span>
        </button>
      </div>

      <div class="tip">
        <strong>提示：</strong> 请选择您云盘（如iCloud, Dropbox, OneDrive）同步目录下的一个文件夹作为您的工作区，以便在多设备间自动同步。
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background-color: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.setup-box {
  background: #fff;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
  max-width: 550px;
  text-align: center;
}
.logo { margin-bottom: 1rem; }
h1 { color: #1d2b3a; margin-bottom: 0.5rem; }
.subtitle { color: #6c757d; margin-bottom: 2.5rem; font-size: 16px; }
.button-group { display: flex; flex-direction: column; gap: 1rem; }
.action-button {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}
.action-button:hover {
  border-color: #007aff;
  box-shadow: 0 4px 15px rgba(0, 122, 255, 0.1);
  transform: translateY(-2px);
}
.btn-title { display: block; font-weight: bold; font-size: 16px; color: #333; }
.btn-desc { font-size: 14px; color: #6c757d; }
.tip { margin-top: 2.5rem; font-size: 13px; color: #6c757d; background: #f8f9fa; padding: 10px; border-radius: 6px; }
.error-message {
  color: #842029;
  background-color: #f8d7da;
  border: 1px solid #f5c2c7;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: .25rem;
  text-align: center;
  font-size: 14px;
}
</style>