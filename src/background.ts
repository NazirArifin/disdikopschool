/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
'use strict'
let win: BrowserWindow | null

import { app, protocol, BrowserWindow, Menu, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'
import { download } from 'electron-dl'
import { autoUpdater } from 'electron-updater'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  Menu.setApplicationMenu(null)

  // Create the browser window.
  win = new BrowserWindow({
    width: 1100,
    height: 600,
    title: 'Aplikasi Absensi',
    fullscreenable: false,
    maximizable: false,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      // nodeIntegration: (process.env
      //     .ELECTRON_NODE_INTEGRATION as unknown) as boolean
      nodeIntegration: true,
      enableRemoteModule: true,
      webSecurity: false
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
    // if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    win.setMenu(null);
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
    autoUpdater.checkForUpdatesAndNotify()
  }

  win.on('closed', () => {
    win = null;
  });
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

const gotTheLock = app.requestSingleInstanceLock();
if ( ! gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (win) {
      if (win.isMaximized()) win.restore();
      win.focus();
    }
  });
}

app.setLoginItemSettings({
  openAtLogin: true
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
  // const tray = new Tray('./icon.ico');
  // const contextMenu = Menu.buildFromTemplate([
  //   { 
  //     label: 'Tampilkan', type: 'normal', click: () => {

  //     },
  //   },
  //   {
  //     label: 'Tutup', type: 'normal', click: () => app.quit()
  //   }
  // ]);
  // tray.setToolTip('opschool');
  // tray.setContextMenu(contextMenu);
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

const formatBytes = (a: number, b = 2) => {
  if(0===a)return"0 Bytes";const c=0>b?0:b,d=Math.floor(Math.log(a)/Math.log(1024));return parseFloat((a/Math.pow(1024,d)).toFixed(c))+" "+["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"][d]
}

// autoupdater
autoUpdater.on('update-available', () => {
  if (win) {
    win.webContents.send('update_available');
  }
});
autoUpdater.on('update-downloaded', () => {
  if (win) {
    win.webContents.send('update_downloaded');
  }
});
autoUpdater.on('error', error => {
  if (win) {
    win.webContents.send('update_error', error);
  }
});
autoUpdater.on('download-progress', progress => {
  let message = "DOWNLOAD SPEED: " + formatBytes(progress.bytesPerSecond);
  message = message + ' - TERDOWNLOAD: ' + Math.round(progress.percent) + '%';
  if (win) {
    win.webContents.send('download_progress', message);
  }
});

ipcMain.on('download-item', async (event, { url }) => {
  const win = BrowserWindow.getFocusedWindow();
  await download(win, url, {
    saveAs: true,
    onCompleted: () => {
      event.sender.send('download-success', url);
    }
  });
});

ipcMain.handle('get-version', async (event) => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', async (event) => {
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

ipcMain.handle('ping-finger-machine', (event, ...args): Promise<any> => {
  return new Promise((resolve, reject) => {
    const exec = require('child_process').exec;
    exec(`ping ${args[0]}`, function(err: any, stdout: string, stderr: any) {
      if (err) {
        reject(err); return;
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
ipcMain.handle('write-log', (event, ...args): Promise<any> => {
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
    } catch(err) {
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