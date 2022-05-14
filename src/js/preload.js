const {contextBridge, ipcRenderer} = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
    quit: () => ipcRenderer.send("mainWindow:close"),
    minimize: () => ipcRenderer.send("mainWindow:minimize"),
    openUrlWithExternal: (pageUrl) => ipcRenderer.send("mainWindow:openUrlWithExternal", pageUrl),
    openPathWithExplorer: (path) => ipcRenderer.send("mainWindow:openPathWithExplorer", path),
    openDirectoryPicker: () => ipcRenderer.invoke("mainWindow:openDirectoryPicker"),
    updateWithKeywords: (keywords) => ipcRenderer.invoke("mainWindow:updateWithKeywords", keywords),
    addTorrent: (id, torrentId, isRestore, fromSubscription, downloadPath) => ipcRenderer.send("mainWindow:addTorrent", id, torrentId, isRestore, fromSubscription, downloadPath),
    onTorrentReady: (callback) => ipcRenderer.on("mainWindow:onTorrentReady", callback),
    onTorrentProgress: (callback) => ipcRenderer.on("mainWindow:onTorrentProgress", callback),
    onTorrentDownload: (callback) => ipcRenderer.on("mainWindow:onTorrentDownload", callback),
    onTorrentUpload: (callback) => ipcRenderer.on("mainWindow:onTorrentUpload", callback),
    onTorrentDone: (callback) => ipcRenderer.on("mainWindow:onTorrentDone", callback),
    openWarningDialog: (textContent) => ipcRenderer.send("mainWindow:openWarningDialog", textContent),
    deleteTorrent: (id, cleanDelete) => ipcRenderer.send("mainWindow:deleteTorrent", id, cleanDelete),
    pauseTorrent: (id) => ipcRenderer.send("mainWindow:pauseTorrent", id),
    resumeTorrent: (id, torrentId, fromSubscription, downloadPath) => ipcRenderer.send("mainWindow:resumeTorrent", id, torrentId, fromSubscription, downloadPath),
    setRunAtStartup: (flag) => ipcRenderer.send("mainWindow:setRunAtStartup", flag),
    setClearTodayTime: (clearTodayHour, clearTodayMinute, subscriptionPath) => ipcRenderer.send("mainWindow:setClearTodayTime", clearTodayHour, clearTodayMinute, subscriptionPath),
    dialogLoaded: () => ipcRenderer.send("styledDialog:dialogLoaded"),
    closeDialog: () => ipcRenderer.send("styledDialog:closeDialog"),
    onInitTextContent: (callback) => ipcRenderer.on("styledDialog:onInitTextContent", callback),
    clearToday: (subscriptionPath) => ipcRenderer.send("mainWindow:clearToday", subscriptionPath),
    getSystemDownloadPath: () => ipcRenderer.sendSync("mainWindow:getSystemDownloadPath"),
    pathJoin: (...paths) => ipcRenderer.invoke("mainWindow:pathJoin", paths)
})