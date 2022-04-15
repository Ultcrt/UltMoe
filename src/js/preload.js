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
    setClearTodayTime: (clearTodayTime, downloadPath) => ipcRenderer.send("mainWindow:setClearTodayTime", clearTodayTime, downloadPath),
    closeDialog: () => ipcRenderer.send("styledDialog:closeDialog"),
    onInitTextContent: (callback)=> ipcRenderer.on("styledDialog:onInitTextContent", callback)
})