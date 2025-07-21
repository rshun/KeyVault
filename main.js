const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// 配置文件路径 (存储在本地，不-同-步!)
const configPath = path.join(app.getPath('userData'), 'config.json');

// 从配置文件读取工作区路径
function getWorkspacePath() {
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.workspacePath;
    } catch (e) {
      return null;
    }
  }
  return null;
}

// 保存工作区路径到配置文件
function setWorkspacePath(dirPath) {
  const workspace = { workspacePath: dirPath };
  fs.writeFileSync(configPath, JSON.stringify(workspace, null, 2));
  // 将路径设置到环境变量，供后端使用
  process.env.WORKSPACE_PATH = dirPath;
}

// 后端服务启动函数
function startBackend() {
  const backendPath = path.join(__dirname, 'backend/src/server.js');
  console.log(`Starting backend by requiring: ${backendPath}`);
  try {
    require(backendPath);
  } catch (error) {
    console.error('Failed to start backend:', error);
    dialog.showErrorBox('后台服务错误', `无法启动核心服务:\n${error.message}`);
    app.quit();
  }
}

// 主窗口创建函数
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, center: true, frame: false,
    titleBarStyle: 'hidden', titleBarOverlay: { color: '#f0f2f5', symbolColor: '#333', height: 40 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, contextIsolation: true,
    },
  });
  mainWindow.setMenu(null);
  const isDev = process.env.DEV_MODE === 'true';
  if (app.isPackaged || !isDev) {
    mainWindow.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// --- 应用生命周期 ---
app.whenReady().then(() => {
  const workspacePath = getWorkspacePath();

  if (workspacePath && fs.existsSync(workspacePath)) {
    setWorkspacePath(workspacePath); 
    startBackend();
    createWindow();
  } else {
    createWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC 通信 ---

ipcMain.handle('workspace:get-path', () => {
  return getWorkspacePath();
});

ipcMain.handle('workspace:create', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: '选择一个空文件夹作为新工作区',
    properties: ['openDirectory', 'createDirectory']
  });
  if (canceled || filePaths.length === 0) return null;
  const dirPath = filePaths[0];
  setWorkspacePath(dirPath);
  startBackend();
  return dirPath;
});

ipcMain.handle('workspace:open', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: '选择一个已存在的工作区文件 (users.db)',
    filters: [{ name: 'KeyVault Workspace', extensions: ['db'] }],
    properties: ['openFile']
  });
  if (canceled || filePaths.length === 0) return null;
  const dirPath = path.dirname(filePaths[0]);
  setWorkspacePath(dirPath);
  startBackend();
  return dirPath;
});

// 新增：监听来自渲染进程的退出请求
ipcMain.on('app:quit', () => {
  app.quit();
});