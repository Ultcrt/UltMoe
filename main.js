const {app, BrowserWindow, Tray, Menu, ipcMain, shell, dialog} = require('electron')
const axios = require('axios')
const cheerio = require('cheerio')
const path = require('path')
const WebTorrent = require("webtorrent");
const fs = require('fs');

function createMainWindow() {
    const mainWindow = new BrowserWindow({
        width: 1050,
        height: 650,

        frame: false,
        resizable: false,

        transparent: true,
        backgroundColor: '#00000000',

        icon: "assets/UltMoe.ico",

        webPreferences: {
            preload: path.join(__dirname, 'src/js/preload.js')
        }
    })

    mainWindow.removeMenu()

    mainWindow.loadFile('src/html/mainWindow.html')

    const tray = new Tray("assets/UltMoe.ico")

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
                click: () => app.quit()
            }
        ])
        tray.popUpContextMenu(menuConfig)
    })

    const downloader = new WebTorrent()

    ipcMain.on("mainWindow:close", ()=>{
        app.quit()
    })

    ipcMain.on("mainWindow:minimize", ()=>{
        mainWindow.hide()
    })

    ipcMain.on("mainWindow:openUrlWithExternal", (event, url)=>{
        shell.openExternal(url)
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
            }
        }

        for (const keyword of keywords) {
            searchUrl += keyword + '+'
        }

        return new Promise((resolve, reject) => {
            axios.get(encodeURI(searchUrl), config).then((response) => {
                if (response.status === 200) {
                    const $ = cheerio.load(response.data)
                    const targetUrl = $("#topic_list").find("tbody:first").find("tr:first")
                        .find(".title").find("a[target='_blank']").attr("href")

                    axios.get(targetUrl, config).then((response) => {
                        if (response.status === 200) {
                            const $ = cheerio.load(response.data)
                            const targetTorrent = "https:" + $("#tabs-1").find("a:first").attr("href")
                            const completeTargetUrl = baseUrl + targetUrl
                            resolve({"url": completeTargetUrl, "torrent": targetTorrent})
                        }
                    })
                }
            })
        })
    })

    ipcMain.on("mainWindow:download", (event, torrent, path, name)=>{
        const todayPath = path.join(path, "今日更新")
        const subscriptionPath = path.join(path, name)

        if (!fs.existsSync(path)){
            fs.mkdirSync(path, { recursive: true });
        }
        downloader.add(torrent, {
            "path": path,
            "announce": "https://raw.githubusercontent.com/ngosang/trackerslist/master/trackers_all.txt"
        }, function (torrent) {
            torrent.on('done', function () {
                torrent.files
            })
        })
    })
}

app.enableSandbox()

app.whenReady().then(()=> {
    createMainWindow()
})