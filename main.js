const { app, BrowserWindow, Tray, Menu, ipcMain, shell, dialog, Notification } = require('electron')
const axios = require('axios')
const cheerio = require('cheerio')
const path = require('path')
const WebTorrent = require("webtorrent");
const fs = require('fs');
const https = require("https");
const schedule = require("node-schedule");

const updateStatus = {
    "SUCCESS": 0,
    "NOT_FOUND": 1,
    "NETWORK_ERROR": 2
}

const downloader = new WebTorrent()
const torrentMap = {}

let job = schedule.scheduleJob('0 0 1 1 *', function(){});

app.enableSandbox()

app.whenReady().then(()=> {
    createMainWindow()
})

function mkdirRecursively(path) {
    if (!fs.existsSync(path)){
        fs.mkdirSync(path, { recursive: true });
    }
}

function quitApp() {
    downloader.destroy(null)
    app.quit()
}

function createMainWindow() {
    const mainWindow = new BrowserWindow({
        width: 1050,
        height: 650,

        show: false,

        frame: false,
        resizable: false,

        transparent: true,

        icon: path.join(__dirname, "assets/UltMoe.png"),

        webPreferences: {
            preload: path.join(__dirname, 'src/js/preload.js')
        }
    })

    mainWindow.removeMenu()

    mainWindow.loadFile(path.join(__dirname, 'src/html/mainWindow.html'))

    const tray = new Tray(path.join(__dirname, "assets/UltMoe.png"))

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
        return dialog.showOpenDialogSync(mainWindow, {properties: ['openDirectory']})[0]
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

    ipcMain.on("mainWindow:openWarningDialog", (event, textContent)=>{
        if (mainWindow.isVisible()) {
            const styledDialog = new BrowserWindow({
                parent: mainWindow,
                modal: true,

                width: 450,
                height: 250,

                frame: false,
                resizable: false,

                transparent: true,

                icon: path.join(__dirname, "assets/UltMoe.png"),

                webPreferences: {
                    preload: path.join(__dirname, 'src/js/preload.js')
                }
            })

            styledDialog.removeMenu()

            styledDialog.loadFile(path.join(__dirname, 'src/html/styledDialog.html'))

            ipcMain.on("styledDialog:closeDialog", ()=>{
                styledDialog.destroy()
            })

            styledDialog.webContents.once("dom-ready", ()=>styledDialog.webContents.send("styledDialog:onInitTextContent", "UltMoe", textContent))
        }
        else {
            new Notification({ title: "UltMoe", body: textContent }).show()
        }
    })

    ipcMain.on("mainWindow:deleteTorrent", (event, id, cleanDelete)=>{
        torrentMap[id].destroy({destroyStore: cleanDelete})
    })

    ipcMain.on("mainWindow:setRunAtStartup", (event, flag) => {
        if (app.isPackaged) {
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
}