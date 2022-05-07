const {contextBridge, ipcRenderer} = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
    quit: () => ipcRenderer.send("mainWindow:close"),
    minimize: () => ipcRenderer.send("mainWindow:minimize"),
    openUrlWithExternal: (pageUrl) => ipcRenderer.send("mainWindow:openUrlWithExternal", pageUrl),
    openDirectoryPicker: () => ipcRenderer.invoke("mainWindow:openDirectoryPicker"),
    updateWithKeywords: (keywords) => ipcRenderer.invoke("mainWindow:updateWithKeywords", keywords),
    download: (torrentUrl, downloadPath, name, id) => ipcRenderer.send("mainWindow:download", torrentUrl, downloadPath, name, id),
    onDownloadDone: (callback) => ipcRenderer.on("mainWindow:onDownloadDone", callback),
    onDownloadProgressUpdate: (callback) => ipcRenderer.on("mainWindow:onDownloadProgressUpdate", callback),
    openWarningDialog: (textContent) => ipcRenderer.send("mainWindow:openWarningDialog", textContent),
    deleteTorrent: (id, cleanDelete) => ipcRenderer.send("mainWindow:deleteTorrent", id, cleanDelete),
    setRunAtStartup: (flag) => ipcRenderer.send("mainWindow:setRunAtStartup", flag),
    setClearTodayTime: (clearTodayHour, clearTodayMinute, downloadPath) => ipcRenderer.send("mainWindow:setClearTodayTime", clearTodayHour, clearTodayMinute, downloadPath),
    dialogLoaded: () => ipcRenderer.send("styledDialog:dialogLoaded"),
    closeDialog: () => ipcRenderer.send("styledDialog:closeDialog"),
    onInitTextContent: (callback)=> ipcRenderer.on("styledDialog:onInitTextContent", callback),
    // TODO Fix downloadPath not used
    clearToday: (downloadPath) => ipcRenderer.send("mainWindow:clearToday", downloadPath)
})