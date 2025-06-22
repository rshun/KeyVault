const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
<<<<<<< HEAD

let mainWindow;

// --- 数据库路径设置 ---
// 1. 定义一个正确的、持久化的 users.db 路径
const usersDbPath = path.join(app.getPath('userData'), 'users.db');
// 2. 通过环境变量将这个路径传递给后端
process.env.USER_DB_PATH = usersDbPath;

// 计算 keyvault.db 文件路径 (这个可能已经不再使用，但保留以防万一)
const dbPath = app.isPackaged
  ? path.join(path.dirname(app.getPath('exe')), 'keyvault.db')
  : path.join(__dirname, 'backend/keyvault.db');
=======
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
>>>>>>> dev

// 保存工作区路径到配置文件
function setWorkspacePath(dirPath) {
  const workspace = { workspacePath: dirPath };
  fs.writeFileSync(configPath, JSON.stringify(workspace, null, 2));
  // 将路径设置到环境变量，供后端使用
  process.env.WORKSPACE_PATH = dirPath;
}

<<<<<<< HEAD

// --- 后端服务启动函数 (已修改) ---
=======
// 后端服务启动函数
>>>>>>> dev
function startBackend() {
  const backendPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked/backend/src/server.js')
    : path.join(__dirname, 'backend/src/server.js');
<<<<<<< HEAD

  console.log(`Starting backend by requiring: ${backendPath}`);
  
  try {
    // 直接 require 后端服务器。这会在当前进程中执行脚本并启动服务器。
    require(backendPath);
  } catch (error) {
    console.error('Failed to start backend:', error);
    // 向用户显示一个更友好的错误对话框
    dialog.showErrorBox('后台服务错误', `无法启动核心服务:\n${error.message}`);
    // 退出应用，因为没有后台服务，应用无法工作
=======
  console.log(`Starting backend by requiring: ${backendPath}`);
  try {
    require(backendPath);
  } catch (error) {
    console.error('Failed to start backend:', error);
    dialog.showErrorBox('后台服务错误', `无法启动核心服务:\n${error.message}`);
>>>>>>> dev
    app.quit();
  }
}

<<<<<<< HEAD
// --- 主窗口创建函数 ---
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    center: true,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#f0f2f5',
      symbolColor: '#333',
      height: 40
    },
=======
// 主窗口创建函数
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, center: true, frame: false,
    titleBarStyle: 'hidden', titleBarOverlay: { color: '#f0f2f5', symbolColor: '#333', height: 40 },
>>>>>>> dev
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, contextIsolation: true,
    },
  });
<<<<<<< HEAD

=======
>>>>>>> dev
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

<<<<<<< HEAD
// --- 应用生命周期事件 ---

// 启动流程 (已修改)
app.whenReady().then(() => {
  console.time('Startup');

  console.time('Backend');
  // 直接调用启动函数
  startBackend();
  console.timeEnd('Backend');
=======
// --- 应用生命周期 ---
app.whenReady().then(() => {
  const workspacePath = getWorkspacePath();

  // 如果工作区未设置，则不启动后端和主窗口，先让用户设置
  if (workspacePath && fs.existsSync(workspacePath)) {
    setWorkspacePath(workspacePath); // 确保环境变量被设置
    startBackend();
    createWindow();
  } else {
    // 如果没有配置，理论上前端应该显示一个设置页面
    // 这里我们先假定前端会处理，或者可以通过一个专门的设置窗口来做
    // 为简单起见，我们先创建窗口，让前端Vue来处理逻辑
    createWindow();
  }
>>>>>>> dev

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

<<<<<<< HEAD
// 所有窗口关闭时退出（非 mac）
=======
>>>>>>> dev
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

<<<<<<< HEAD
// 退出时不再需要手动关闭后端子进程
app.on('will-quit', () => {
  // 因为后端和主进程在一起，所以不再需要手动关闭子进程
});

// --- IPC 通信 ---
ipcMain.handle('dialog:show-save-dialog', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: '选择数据库保存路径',
    defaultPath: path.join(app.getPath('documents'), 'keyvault.db'),
    buttonLabel: '保存',
    filters: [
      { name: '数据库文件', extensions: ['db'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });

  if (canceled) {
    return ''; // 如果用户取消，返回空字符串
  } else {
    return filePath;
  }
=======
// --- IPC 通信，用于设置工作区 ---

// 检查工作区是否已设置
ipcMain.handle('workspace:get-path', () => {
  return getWorkspacePath();
});

// 打开对话框让用户选择一个目录作为新工作区
ipcMain.handle('workspace:create', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: '选择一个空文件夹作为新工作区',
    properties: ['openDirectory', 'createDirectory']
  });
  if (canceled || filePaths.length === 0) return null;
  const dirPath = filePaths[0];
  setWorkspacePath(dirPath);
  startBackend(); // 初始化后端
  return dirPath;
});

// 打开对话框让用户选择一个已存在的 users.db 文件
ipcMain.handle('workspace:open', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: '选择一个已存在的工作区文件 (users.db)',
    filters: [{ name: 'KeyVault Workspace', extensions: ['db'] }],
    properties: ['openFile']
  });
  if (canceled || filePaths.length === 0) return null;
  const dirPath = path.dirname(filePaths[0]); // 获取users.db的父目录
  setWorkspacePath(dirPath);
  startBackend(); // 初始化后端
  return dirPath;
>>>>>>> dev
});