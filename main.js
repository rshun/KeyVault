const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess;
let mainWindow;

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

  // 确保窗口一创建就最大化
  mainWindow.maximize();
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

function startBackend() {
    const backendPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked/backend/src/server.js')
      : path.join(__dirname, 'backend/src/server.js');
      
    console.log(`Starting backend at: ${backendPath}`);
    backendProcess = spawn('node', [backendPath]);
    backendProcess.stdout.on('data', (data) => console.log(`Backend stdout: ${data}`));
    backendProcess.stderr.on('data', (data) => console.error(`Backend stderr: ${data}`));
    backendProcess.on('close', (code) => console.log(`Backend process exited with code ${code}`));
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  if (backendProcess) backendProcess.kill();
});
