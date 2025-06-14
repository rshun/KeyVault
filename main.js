const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess;
let mainWindow;

// 计算 db 文件路径
const dbPath = app.isPackaged
  ? path.join(path.dirname(app.getPath('exe')), 'keyvault.db')
  : path.join(__dirname, 'backend/keyvault.db');

process.env.DATABASE_PATH = dbPath;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#f0f2f5',
      symbolColor: '#333',
      height: 40
    },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.maximize();
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

function startBackend() {
  return new Promise((resolve, reject) => {
    const backendPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked/backend/src/server.js')
      : path.join(__dirname, 'backend/src/server.js');

    console.log(`Starting backend: ${backendPath}`);
    backendProcess = spawn('node', [backendPath]);

    let resolved = false;

    backendProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      console.log(`Backend stdout: ${msg}`);

      // 等后端打印指定内容时再 resolve
      if (!resolved && msg.includes('Backend started')) {
        resolved = true;
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend stderr: ${data}`);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend exited with code ${code}`);
      if (!resolved) reject(new Error('Backend process exited before ready.'));
    });
  });
}

// 启动流程
app.whenReady().then(async () => {
  console.time('Startup');

  try {
    console.time('Backend');
    await startBackend();  // 等待后端就绪
    console.timeEnd('Backend');
  } catch (err) {
    console.error('Backend failed to start:', err);
    app.quit(); // 后端失败则退出整个应用
    return;
  }

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

// 退出时关闭后端子进程
app.on('will-quit', () => {
  if (backendProcess) backendProcess.kill();
});
