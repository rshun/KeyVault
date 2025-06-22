const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');

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

process.env.DATABASE_PATH = dbPath;


// --- 后端服务启动函数 (已修改) ---
function startBackend() {
  const backendPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked/backend/src/server.js')
    : path.join(__dirname, 'backend/src/server.js');

  console.log(`Starting backend by requiring: ${backendPath}`);
  
  try {
    // 直接 require 后端服务器。这会在当前进程中执行脚本并启动服务器。
    require(backendPath);
  } catch (error) {
    console.error('Failed to start backend:', error);
    // 向用户显示一个更友好的错误对话框
    dialog.showErrorBox('后台服务错误', `无法启动核心服务:\n${error.message}`);
    // 退出应用，因为没有后台服务，应用无法工作
    app.quit();
  }
}

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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setMenu(null);

  const isDev = process.env.DEV_MODE === 'true';

  if (app.isPackaged || !isDev) {
    // 加载静态前端页面
    mainWindow.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
  } else {
    // 加载开发服务器页面
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// --- 应用生命周期事件 ---

// 启动流程 (已修改)
app.whenReady().then(() => {
  console.time('Startup');

  console.time('Backend');
  // 直接调用启动函数
  startBackend();
  console.timeEnd('Backend');

  console.time('CreateWindow');
  createWindow();
  console.timeEnd('CreateWindow');

  console.timeEnd('Startup');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 所有窗口关闭时退出（非 mac）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

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
});