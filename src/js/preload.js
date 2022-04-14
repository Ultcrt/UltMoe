const {contextBridge, ipcRenderer} = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
    quit: () => ipcRenderer.send("mainWindow:close"),
    minimize: () => ipcRenderer.send("mainWindow:minimize"),
    openUrlWithExternal: (url) => ipcRenderer.send("mainWindow:openUrlWithExternal", url),
    openDirectoryPicker: () => ipcRenderer.invoke("mainWindow:openDirectoryPicker"),
    updateWithKeywords: (keywords) => ipcRenderer.invoke("mainWindow:updateWithKeywords", keywords),
    download: (torrent, path, name) => ipcRenderer.send("mainWindow:download", torrent, path, name)
})