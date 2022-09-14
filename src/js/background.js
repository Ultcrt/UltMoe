'use strict'

import { app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import fs from "fs";
import { Tray, Menu, ipcMain, shell, dialog, Notification } from 'electron'
import axios from 'axios'
import cheerio from 'cheerio'
import path from 'path'
import WebTorrent from "webtorrent"
import https from "https"
import schedule from "node-schedule"

const isDevelopment = process.env.NODE_ENV !== 'production'

const torrentClient = new WebTorrent()

const torrentMap = {}

let mainWindow

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

let iconPath;

if (process.env.WEBPACK_DEV_SERVER_URL) {
  iconPath = path.join(path.dirname(app.getAppPath()), "build/icons")
} else {
  iconPath = path.join(path.dirname(app.getPath("exe")), "resources/")
}

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

torrentClient.on("error", function (err){
  if (err.message.startsWith("Cannot add duplicate torrent")) {
    openWarningDialog("UltMoe", "种子已位于下载队列中")
  }
})

function mkdirRecursively(path) {
  if (!fs.existsSync(path)){
    fs.mkdirSync(path, { recursive: true });
  }
}

function quitApp() {
  torrentClient.destroy(()=>{})
  app.quit()
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1020,
    height: 620,

    show: isDevelopment,

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

  ipcMain.on("mainWindow:openPathWithExplorer", (event, path)=>{
    shell.showItemInFolder(path)
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

  ipcMain.on("mainWindow:updateSubscription", (event, id, keywords)=>{
    const baseUrl = "https://share.dmhy.org"
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

              mainWindow.webContents.send("mainWindow:onSubscriptionReady", id, keywords, targetPageUrl, targetTorrentUrl)
            }
          }).catch(()=>{
            openWarningDialog("UltMoe", `订阅"${keywords[0]}"更新时发生网络错误\n`)
          })
        }
        else {
          openWarningDialog("UltMoe", `订阅"${keywords[0]}"的搜索结果为空\n`)
        }
      }
    }).catch(()=> {
      openWarningDialog("UltMoe", `订阅"${keywords[0]}"更新时发生网络错误\n`)
    })
  })

  ipcMain.on("mainWindow:addTorrent", addTorrent)

  ipcMain.on("mainWindow:openWarningDialog", async (event, title, body) => {
    await openWarningDialog(title, body)
  })

  ipcMain.on("mainWindow:deleteTorrent", deleteTorrent)

  ipcMain.on("mainWindow:pauseTorrent", (event, id)=>{
    deleteTorrent(event, id, false)
  })

  ipcMain.on("mainWindow:resumeTorrent", (event, id, torrentId, fromSubscription, downloadPath)=>{
    addTorrent(event, id, torrentId, true, fromSubscription, downloadPath)
  })

  ipcMain.on("mainWindow:setRunAtStartup", (event, flag) => {
    if (!process.env.WEBPACK_DEV_SERVER_URL) {
      app.setLoginItemSettings({
        openAtLogin: flag,
        openAsHidden: true
      })
    }
  })

  ipcMain.on("mainWindow:clearToday", (event, subscriptionPath) => {
    fs.rmSync(path.join(subscriptionPath, "今日更新"), { recursive: true, force: true });
  })

  ipcMain.on("mainWindow:setClearTodayTime", (event, clearTodayHour, clearTodayMinute, subscriptionPath) => {
    job.cancel()
    job = schedule.scheduleJob(`${clearTodayMinute} ${clearTodayHour} * * *`, function () {
      fs.rmSync(path.join(subscriptionPath, "今日更新"), { recursive: true, force: true });
    })
  })

  ipcMain.on("mainWindow:getSystemDownloadPath", (event) => {
    event.returnValue = app.getPath("downloads")
  })

  ipcMain.handle("mainWindow:pathJoin", (event, paths) => {
    return path.join(...paths)
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

async function openWarningDialog(title, body) {
  if (mainWindow.isVisible()) {
    const styledDialog = new BrowserWindow({
      parent: mainWindow,
      modal: true,

      width: 420,
      height: 220,

      frame: false,
      resizable: false,

      transparent: true,

      icon: path.join(iconPath, "256x256.png"),

      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
    })

    styledDialog.removeMenu()

    ipcMain.on("styledDialog:closeDialog", () => {
      ipcMain.removeAllListeners("styledDialog:closeDialog")
      ipcMain.removeAllListeners("styledDialog:dialogLoaded")
      styledDialog.destroy()
    })

    ipcMain.on("styledDialog:dialogLoaded", (event)=>{
      event.sender.send("styledDialog:onInitTextContent", title, body)
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
    new Notification({title, body}).show()
  }
}

function addTorrent(event, id, torrentId, isRestore, fromSubscription, downloadPath) {
  let torrentTarget

  if (isRestore) {
    torrentTarget = Buffer.from(torrentId, "base64")
  }
  else {
    torrentTarget = torrentId
  }

  mkdirRecursively(downloadPath)

  torrentMap[id] = torrentClient.add(torrentTarget, {
    "path": downloadPath,
    "announce": "https://raw.githubusercontent.com/ngosang/trackerslist/master/trackers_all.txt"
  }, function (torrent) {
    // ontorrent callback is invoked on torrent ready event
    mainWindow.webContents.send(
        "mainWindow:onTorrentReady",
        id, torrent.name, torrent.torrentFile.toString("base64"), torrent.progress,
        torrent.length, downloadPath, fromSubscription
    )

    torrent.on("upload", function () {
      mainWindow.webContents.send("mainWindow:onTorrentUpload", id, torrent.uploadSpeed)
    })

    torrent.on("download", function () {
      mainWindow.webContents.send("mainWindow:onTorrentProgress", id, torrent.progress)
      mainWindow.webContents.send("mainWindow:onTorrentDownload", id, torrent.downloadSpeed, torrent.timeRemaining)
    })

    torrent.on("done", function () {
      mainWindow.webContents.send("mainWindow:onTorrentDone", id)
      if (fromSubscription) {
        const todayPath = path.join(path.dirname(downloadPath), "今日更新")
        mkdirRecursively(todayPath)

        for (const file of torrent.files) {
          const dstPathWithName = path.join(todayPath, file.name)
          fs.copyFile(file.path, dstPathWithName, () => {})
        }
      }
    })
  })
}

function deleteTorrent(event, id, cleanDelete) {
  if (id in torrentMap) {
    torrentMap[id].destroy({destroyStore: cleanDelete})
    delete torrentMap[id]
  }
}