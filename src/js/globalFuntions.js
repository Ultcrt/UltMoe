export function getSubscriptions() {
    if (localStorage.getItem("subscriptions")) {
        return JSON.parse(localStorage.getItem("subscriptions"))
    }
    else {
        return {}
    }
}

export function getDownloads() {
    if (localStorage.getItem("downloads")) {
        return JSON.parse(localStorage.getItem("downloads"))
    }
    else {
        return {}
    }
}

export function getSettings() {
    if (localStorage.getItem("settings")) {
        return JSON.parse(localStorage.getItem("settings"))
    }
    else {
        return {
            "runAtStartup": false,
            "cleanDelete": false,
            "pollingInterval": 5,
            "clearTodayTime": { "hour": 0, "minute": 0},
            "downloadPath": window.electronAPI.getSystemDownloadPath(),
            "subscriptionPath": window.electronAPI.getSystemDownloadPath()
        }
    }
}

export function getLastAppRunningTimestamp() {
    if (localStorage.getItem("lastAppRunningTimestamp")) {
        return parseInt(localStorage.getItem("lastAppRunningTimestamp"))
    }
    else {
        return 0
    }
}

export function hourToMs(hour) {
    return hour * 60 * 60 * 1000;
}

export function inTheSameDay(dateA, dateB) {
    return (dateA.getDate() === dateB.getDate()) && (dateA.getMonth() === dateB.getMonth()) && dateA.getFullYear() === dateB.getFullYear()
}

export function handleUpdateStatus(status, name) {
    switch (status) {
        case 0:
            return { isSuccess: true, warning: "" }
        case 1:
            return { isSuccess: false, warning: `订阅"${name}"的搜索结果为空\n` }
        case 2:
            return { isSuccess: false, warning: `订阅"${name}"更新时发生网络错误\n` }
    }
}