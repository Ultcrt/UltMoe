'use strict'

import { app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import fs from "fs";
const isDevelopment = process.env.NODE_ENV !== 'production'

import { Tray, Menu, ipcMain, shell, dialog, Notification } from 'electron'
import axios from 'axios'
import cheerio from 'cheerio'
import path from 'path'
import WebTorrent from "webtorrent"
import https from "https"
import schedule from "node-schedule"

const updateStatus = {
  "SUCCESS": 0,
  "NOT_FOUND": 1,
  "NETWORK_ERROR": 2
}

const downloader = new WebTorrent()
const torrentMap = {}

let mainWindow = null;

let job = schedule.scheduleJob('0 0 1 1 *', function(){})

const gotTheSingleLock = app.requestSingleInstanceLock()

if (gotTheSingleLock) {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) {
        mainWindow.show()
      }
      mainWindow.focus()
    }
  })
}
else {
  app.quit()
}

app.enableSandbox()

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
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

function mkdirRecursively(path) {
  if (!fs.existsSync(path)){
    fs.mkdirSync(path, { recursive: true });
  }
}

function quitApp() {
  downloader.destroy(null)
  app.quit()
}

async function createWindow() {
  let iconPath;

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    iconPath = path.join(path.dirname(app.getAppPath()), "build/icons")
  } else {
    iconPath = path.join(path.dirname(app.getPath("exe")), "resources/")
  }

  mainWindow = new BrowserWindow({
    width: 1050,
    height: 650,

    show: false,

    frame: false,
    resizable: false,

    transparent: true,

    icon: path.join(iconPath, "256x256.png"),

    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.removeMenu()

  const tray = new Tray(path.join(iconPath, "16x16.png"))

  tray.setToolTip('UltMoe')

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
    }
  })

  tray.on('right-click', () => {
    const menuConfig = Menu.buildFromTemplate([
      {
        label: '退出',
        click: () => quitApp()
      }
    ])
    tray.popUpContextMenu(menuConfig)
  })

  ipcMain.on("mainWindow:close", ()=>{
    quitApp()
  })

  ipcMain.on("mainWindow:minimize", ()=>{
    mainWindow.hide()
  })

  ipcMain.on("mainWindow:openUrlWithExternal", (event, pageUrl)=>{
    shell.openExternal(pageUrl)
  })

  ipcMain.handle("mainWindow:openDirectoryPicker", ()=>{
    const result = dialog.showOpenDialogSync(mainWindow, {properties: ['openDirectory']})
    if (result === undefined) {
      return result
    }
    else {
      return result[0]
    }
  })

  ipcMain.handle("mainWindow:updateWithKeywords", (event, keywords)=>{
    const baseUrl = "https://www.dmhy.org"
    let searchUrl = "/topics/list?keyword="
    const config = {
      baseURL: baseUrl,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36 Edg/100.0.1185.39"
      },
      httpsAgent: new https.Agent({ keepAlive: true }),
    }

    for (const keyword of keywords) {
      searchUrl += keyword + '+'
    }

    return new Promise((resolve) => {
      axios.get(encodeURI(searchUrl), config).then((response) => {
        if (response.status === 200) {
          const $ = cheerio.load(response.data)
          const targetUrl = $("#topic_list").find("tbody:first").find("tr:first")
              .find(".title").find("a[target='_blank']").attr("href")

          if (targetUrl) {
            axios.get(encodeURI(targetUrl), config).then((response) => {
              if (response.status === 200) {
                const $ = cheerio.load(response.data)
                const targetTorrentUrl = "https:" + $("#tabs-1").find("a:first").attr("href")
                const targetPageUrl = baseUrl + targetUrl
                resolve({
                  "pageUrl": targetPageUrl,
                  "torrentUrl": targetTorrentUrl,
                  "status": updateStatus.SUCCESS
                })
              }
            }).catch(()=>resolve({"status": updateStatus.NETWORK_ERROR}))
          }
          else {
            resolve({"status": updateStatus.NOT_FOUND})
          }
        }
      }).catch(()=>resolve({"status": updateStatus.NETWORK_ERROR}))
    })
  })

  ipcMain.on("mainWindow:download", (event, torrentUrl, downloadPath, name, id)=>{
    const todayPath = path.join(downloadPath, "今日更新", name)
    const subscriptionPath = path.join(downloadPath, name)

    mkdirRecursively(todayPath)
    mkdirRecursively(subscriptionPath)

    torrentMap[id] = downloader.add(torrentUrl, {
      "path": subscriptionPath,
      "announce": "https://raw.githubusercontent.com/ngosang/trackerslist/master/trackers_all.txt"
    }, function (torrent) {
      torrent.on("done", function () {
        for (const file of torrent.files) {
          const dstPathWithName = path.join(todayPath, file.name)
          fs.copyFile(file.path, dstPathWithName, () => {
          })
          mainWindow.webContents.send("mainWindow:onDownloadDone", id)
        }
      })

      torrent.on("download", function () {
        const value = torrent.progress * 100.0
        mainWindow.webContents.send("mainWindow:onDownloadProgressUpdate", id, value)
      })
    })
  })

  ipcMain.on("mainWindow:openWarningDialog", async (event, textContent) => {
    if (mainWindow.isVisible()) {
      const styledDialog = new BrowserWindow({
        parent: mainWindow,
        modal: true,

        width: 450,
        height: 250,

        frame: false,
        resizable: false,

        transparent: true,

        icon: path.join(iconPath, "256x256.png"),

        webPreferences: {
          preload: path.join(__dirname, 'preload.js')
        }
      })

      styledDialog.removeMenu()

      ipcMain.on("styledDialog:closeDialog", (event) => {
        if (event.sender.id === styledDialog.webContents.id) {
          styledDialog.destroy()
        }
      })

      ipcMain.on("styledDialog:dialogLoaded", (event)=>{
        event.sender.send("styledDialog:onInitTextContent", "UltMoe", textContent)
      })

      // Should be placed after ipcMain.on to avoid ipcRenderer sending before ipcMain.on
      if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        await styledDialog.loadURL(process.env.WEBPACK_DEV_SERVER_URL + "styledDialog.html")
        if (!process.env.IS_TEST) styledDialog.webContents.openDevTools()
      } else {
        createProtocol('app')
        // Load the mainWindow.html when not in development
        await styledDialog.loadURL('app://./styledDialog.html')
      }
    } else {
      new Notification({title: "UltMoe", body: textContent}).show()
    }
  })

  ipcMain.on("mainWindow:deleteTorrent", (event, id, cleanDelete)=>{
    if (id in torrentMap) {
      torrentMap[id].destroy({destroyStore: cleanDelete})
    }
  })

  ipcMain.on("mainWindow:setRunAtStartup", (event, flag) => {
    if (!process.env.WEBPACK_DEV_SERVER_URL) {
      app.setLoginItemSettings({
        openAtLogin: flag,
        openAsHidden: true
      })
    }
  })

  ipcMain.on("mainWindow:clearToday", (event, downloadPath) => {
    fs.rmSync(path.join(downloadPath, "今日更新"), { recursive: true, force: true });
  })

  ipcMain.on("mainWindow:setClearTodayTime", (event, clearTodayHour, clearTodayMinute, downloadPath) => {
    job.cancel()
    job = schedule.scheduleJob(`${clearTodayMinute} ${clearTodayHour} * * *`, function () {

      console.log("Clear today schedule triggered")

      fs.rmSync(path.join(downloadPath, "今日更新"), { recursive: true, force: true });
    })
  })

  // Should be placed after ipcMain.on to avoid ipcRenderer sending before ipcMain.on
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL+"mainWindow.html")
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the mainWindow.html when not in development
    await mainWindow.loadURL('app://./mainWindow.html')
  }
}
