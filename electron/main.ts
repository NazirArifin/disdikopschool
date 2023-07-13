import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import path from 'node:path'
import FbDb from '../src/services/fpdb';
import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { download } from 'electron-dl';

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  Menu.setApplicationMenu(null);

  win = new BrowserWindow({
    width: 1100,
    height: 600,
    title: 'Aplikasi Absensi',
    fullscreenable: false,
    maximizable: false,
    // icon: path.join(process.env.PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
      webSecurity: false,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
    // win?.webContents.openDevTools()
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  win = null
  app.quit();
})

app.whenReady().then(createWindow)

const getTheLock = app.requestSingleInstanceLock();
if ( ! getTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

ipcMain.on('enable-dev-tools', () => {
  win?.webContents.openDevTools();
});

// const formatBytes = (a: number, b = 2) => {
//   if(0===a)return"0 Bytes";const c=0>b?0:b,d=Math.floor(Math.log(a)/Math.log(1024));return parseFloat((a/Math.pow(1024,d)).toFixed(c))+" "+["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"][d]
// }

let dbInstance: FbDb|null = null;
ipcMain.handle('db-quick-check', async () => {
  if ( ! dbInstance) {
    dbInstance = await FbDb.getInstance(win);
  }
  try {
    return await dbInstance.quickCheckConnection();
  } catch(err) {
    return err;
  }
});
ipcMain.handle('db-check', async (_event, config) => {
  if ( ! dbInstance) {
    dbInstance = await FbDb.getInstance(win);
  }
  try {
    return await dbInstance.checkConnection(config);
  } catch(err) {
    return err;
  }
});
ipcMain.handle('db-change-setting', async (_event, config) => {
  if ( ! dbInstance) {
    dbInstance = await FbDb.getInstance(win);
  }
  dbInstance.changeSetting(config);
});
ipcMain.handle('db-get-scan-log', async (_event, date) => {
  if ( ! dbInstance) {
    dbInstance = await FbDb.getInstance(win);
  }
  try {
    return await dbInstance.getScanLog(date);
  } catch(err) {
    return err;
  }
});
ipcMain.handle('db-get-pegawai', async () => {
  if ( ! dbInstance) {
    dbInstance = await FbDb.getInstance(win);
  }
  try {
    return await dbInstance.getPegawai();
  } catch(err) {
    return err;
  }
});

ipcMain.handle('get-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', async (_event) => {
  const path = require('path');
  const appPath = path.join(app.getPath('appData'), app.getName(), 'IndexedDB');
  const fs = require('fs');
  fs.rmdir(appPath, { recursive: true }, (error: any) => {
    if (error) {
      console.log(error);
    }
    app.relaunch();
    app.exit();
  });
});

ipcMain.handle('ping-finger-machine', async (_event, ...args) => {
  return new Promise((resolve, reject) => {
    const exec = require('child_process').exec;
    exec(`ping ${args[0]}`, (error: any, stdout: any, _stderr: any) => {
      if (error) {
        reject(error); return;
      }
      if (stdout.search(`Reply from ${args[0]}: bytes=`) != -1) {
        resolve(true);
      } else {
        reject('Unreachable');
      }
    });
  });
}); 

const fileLogPath = (date: string) => {
  return join(app.getPath('appData'), app.getName(), date.replace(/-/g, ''));
}

// membaca file, jika ada data baru di append dan resolve yang baru
ipcMain.handle('write-log', (_event, ...args): Promise<any> => {
  return new Promise((resolve, reject) => {
    const path = fileLogPath(args[0]);
    try {
      // throw exception jika file tidak ada
      const cdata = readFileSync(path, { encoding: 'utf-8' });
      const content = JSON.parse(cdata);
      
      // ada data baru
      if (args[1].length > 0) {
        const apcontent = [...content, ...args[1]];
        writeFileSync(path, JSON.stringify(apcontent));
        resolve(apcontent);
      } else {
        resolve(content);
      }
    } catch(err: any) {
      if (err.code === 'ENOENT') {
        // ada data logs
        if (args[1].length > 0) {
          writeFileSync(path, JSON.stringify(args[1]));
          resolve(args[1]);
        } else {
          resolve([]);
        }
      } else {
        reject(err);
      }
    }
  });
});

ipcMain.on('download-item', async (event, { url }) => {
  // win?.webContents.downloadURL(url);
  // event.sender.send('download-success', url);
  try {
    const win = BrowserWindow.getFocusedWindow();
    await download(win!, url, {
      saveAs: true,
      onStarted: (item) => {
        if (! item.getFilename().endsWith('.zip')) {
          item.cancel();
          event.sender.send('download-success', url);
        }
      },
      onCompleted: () => {
        console.log('download success');
        event.sender.send('download-success', url);
      },
      onCancel: () => {
        console.log('download canceled');
        event.sender.send('download-success', url);
      },
      showProgressBar: true,
    });
  } catch(err) {
    console.log(err);
  }
});

