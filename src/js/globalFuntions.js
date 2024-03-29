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
            "subscriptionPath": window.electronAPI.getSystemDownloadPath(),
            "proxyAddress": "",
            "trackersSubscriptionAddress": ""
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