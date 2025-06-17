const { contextBridge, ipcRenderer } = require('electron');

// 在 window 对象上暴露一个安全的方法，供前端 Vue 组件调用
// 我们只暴露需要的功能，而不是整个 ipcRenderer
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * 调用主进程以显示文件保存对话框
   * @returns {Promise<string>} 用户选择的文件路径，如果取消则为空字符串
   */
  showSaveDialog: () => ipcRenderer.invoke('dialog:show-save-dialog')
});