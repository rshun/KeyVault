const { contextBridge, ipcRenderer } = require('electron');

// 在 window 对象上暴露一个安全的方法，供前端 Vue 组件调用
contextBridge.exposeInMainWorld('electronAPI', {
  // 检查工作区路径是否已设置
  getWorkspacePath: () => ipcRenderer.invoke('workspace:get-path'),
  // 触发“创建新工作区”的对话框
  createWorkspace: () => ipcRenderer.invoke('workspace:create'),
  // 触发“打开现有工作区”的对话框
  openWorkspace: () => ipcRenderer.invoke('workspace:open')
});