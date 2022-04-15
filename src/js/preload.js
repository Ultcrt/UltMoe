const {contextBridge, ipcRenderer} = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
    quit: () => ipcRenderer.send("mainWindow:close"),
    minimize: () => ipcRenderer.send("mainWindow:minimize"),
    openUrlWithExternal: (url) => ipcRenderer.send("mainWindow:openUrlWithExternal", url),
    openDirectoryPicker: () => ipcRenderer.invoke("mainWindow:openDirectoryPicker"),
    updateWithKeywords: (keywords) => ipcRenderer.invoke("mainWindow:updateWithKeywords", keywords),
    download: (torrentUrl, downloadPath, name, id) => ipcRenderer.send("mainWindow:download", torrentUrl, downloadPath, name, id),
    onDownloadDone: (callback) => ipcRenderer.on("mainWindow:onDownloadDone", callback),
    onDownloadProgressUpdate: (callback) => ipcRenderer.on("mainWindow:onDownloadProgressUpdate", callback),
    openWarningDialog: (textContent) => ipcRenderer.send("mainWindow:openWarningDialog", textContent),
    deleteTorrent: (id) => ipcRenderer.send("mainWindow:deleteTorrent", id)
})