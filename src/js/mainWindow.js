const closeButton = document.querySelector("#closeButton")
const minimizeButton = document.querySelector("#minimizeButton")
const subscriptionsItem = document.querySelector("#subscriptionsItem")
const settingsItem = document.querySelector("#settingsItem")
const menuItems = document.querySelectorAll(".menuItem")
const subscriptionsPage = document.querySelector("#subscriptionsPage")
const settingsPage = document.querySelector("#settingsPage")
const detailPages = document.querySelectorAll(".detailPage")
const subscriptionInput = document.querySelector("#subscriptionInput")
const subscriptionSubmitButton = document.querySelector("#subscriptionSubmitButton")
const subscriptionsTable = document.querySelector("#subscriptionsTable")
const runAtStartupCheckbox = document.querySelector("#runAtStartupCheckbox")
const pollingIntervalNumber = document.querySelector("#pollingIntervalNumber")
const downloadPathButton = document.querySelector("#downloadPathButton")
const downloadPathLabel = document.querySelector("#downloadPathLabel")
const cleanDeleteCheckbox = document.querySelector("#cleanDeleteCheckbox")
const clearTodayHour = document.querySelector("#clearTodayHour")
const clearTodayMinute = document.querySelector("#clearTodayMinute")

const subscriptionDeleteButtons = document.getElementsByClassName("subscriptionDeleteButton")
const downloadedTimeUrl = document.getElementsByClassName("downloadedTimeUrl")

let subscriptionRecords = {}
let settingRecords = {
    "runAtStartup": false,
    "cleanDelete": false,
    "pollingInterval": 5,
    "clearTodayTime": { "hour": 0, "minute": 0},
    "downloadPath": "./Download"
}
let lastAppRunningTimestamp = 0

if (localStorage.getItem("lastAppRunningTimestamp")) {
    lastAppRunningTimestamp = localStorage.getItem("lastAppRunningTimestamp")
}

if (localStorage.getItem("subscriptions")) {
    subscriptionRecords = JSON.parse(localStorage.getItem("subscriptions"))

    for(const id in subscriptionRecords) {
        appendSubscription(id, subscriptionRecords[id]["name"], subscriptionRecords[id]["keywords"],
            subscriptionRecords[id]["downloadedTime"], subscriptionRecords[id]["pageUrl"],
            subscriptionRecords[id]["downloaded"])
    }

    initSubscriptionCallback()
}

if (localStorage.getItem("settings")) {
    settingRecords = JSON.parse(localStorage.getItem("settings"))

    runAtStartupCheckbox.checked = settingRecords["runAtStartup"]
    cleanDeleteCheckbox.checked = settingRecords["cleanDelete"]
    pollingIntervalNumber.value = settingRecords["pollingInterval"]
    clearTodayHour.value = settingRecords["clearTodayTime"]["hour"]
    clearTodayMinute.value = settingRecords["clearTodayTime"]["minute"]
    downloadPathLabel.textContent = settingRecords["downloadPath"]
}

window.electronAPI.setRunAtStartup(runAtStartupCheckbox.checked)
window.electronAPI.setClearTodayTime(clearTodayHour.value, clearTodayMinute.value, downloadPathLabel.textContent)

checkClearTodayAtLaunch()

updateSchedule()
let updateIntervalId = setInterval(updateSchedule, hourToMs(pollingIntervalNumber.value))

lastAppRunningTimestamp = Date.now()
localStorage.setItem("lastAppRunningTimestamp", lastAppRunningTimestamp)

closeButton.addEventListener("click", ()=>{
    window.electronAPI.quit()
})

minimizeButton.addEventListener("click", ()=>{
    window.electronAPI.minimize()
})

subscriptionsItem.addEventListener("click", ()=>{
    selectHandler(menuItems, subscriptionsItem)
    selectHandler(detailPages, subscriptionsPage)
})

settingsItem.addEventListener("click", ()=>{
    selectHandler(menuItems, settingsItem)
    selectHandler(detailPages, settingsPage)
})

subscriptionSubmitButton.addEventListener("click", async ()=>{
    if (subscriptionInput.value.trim() !== "") {
        const keywords = subscriptionInput.value.split(" ")
        const {pageUrl, torrentUrl, status} = await window.electronAPI.updateWithKeywords(keywords)
        const id = Date.now().toString()
        const nullDatetime = "----/--/-- --:--:--"
        let name = keywords[0];

        const {isSuccess, warning} = handleUpdateStatus(status, name)

        if (isSuccess) {
            appendSubscription(id, undefined, keywords, nullDatetime, pageUrl, false)

            subscriptionRecords[id] = {
                "name": name,
                "keywords": keywords,
                "downloadedTime": nullDatetime,
                "pageUrl": pageUrl,
                "torrentUrl": torrentUrl,
                "downloaded": false
            }

            localStorage.setItem("subscriptions", JSON.stringify(subscriptionRecords))

            initSubscriptionCallback()

            window.electronAPI.download(torrentUrl, downloadPathLabel.textContent, name, id)

            subscriptionInput.value = ""
        }
        else {
            window.electronAPI.openWarningDialog(warning)
        }
    }
})

runAtStartupCheckbox.addEventListener("click", ()=>{
    window.electronAPI.setRunAtStartup(runAtStartupCheckbox.checked)

    settingRecords["runAtStartup"] = runAtStartupCheckbox.checked
    localStorage.setItem("settings", JSON.stringify(settingRecords))
})

cleanDeleteCheckbox.addEventListener("click", ()=>{
    settingRecords["cleanDelete"] = cleanDeleteCheckbox.checked
    localStorage.setItem("settings", JSON.stringify(settingRecords))
})

clearTodayHour.addEventListener("change", () => {
    if (clearTodayHour.value < 0) {
        clearTodayHour.value = 0
    }
    else if(clearTodayHour.value > 23) {
        clearTodayHour.value = 23
    }

    window.electronAPI.setClearTodayTime(clearTodayHour.value, clearTodayMinute.value, downloadPathLabel.textContent)

    settingRecords["clearTodayTime"]["hour"] = clearTodayHour.value
    localStorage.setItem("settings", JSON.stringify(settingRecords))
})

clearTodayMinute.addEventListener("change", () => {
    if (clearTodayMinute.value < 0) {
        clearTodayMinute.value = 0
    }
    else if(clearTodayMinute.value > 59) {
        clearTodayMinute.value = 59
    }
    window.electronAPI.setClearTodayTime(clearTodayHour.value, clearTodayMinute.value, downloadPathLabel.textContent)

    settingRecords["clearTodayTime"]["minute"] = clearTodayMinute.value
    localStorage.setItem("settings", JSON.stringify(settingRecords))
})

pollingIntervalNumber.addEventListener("change", ()=>{
    if (pollingIntervalNumber.value < 1) {
        pollingIntervalNumber.value = 1
    }
    else if(pollingIntervalNumber.value > 24) {
        pollingIntervalNumber.value = 24
    }

    clearInterval(updateIntervalId)

    updateIntervalId = setInterval(updateSchedule, hourToMs(pollingIntervalNumber.value))

    settingRecords["pollingInterval"] = pollingIntervalNumber.value
    localStorage.setItem("settings", JSON.stringify(settingRecords))
})

downloadPathButton.addEventListener("click", async ()=>{
    downloadPathLabel.textContent = await window.electronAPI.openDirectoryPicker()

    settingRecords["downloadPath"] = downloadPathLabel.textContent
    localStorage.setItem("settings", JSON.stringify(settingRecords))
})

window.electronAPI.onDownloadDone((event, id)=>{
    const targetRow = document.getElementById(id)
    const targetProgress = targetRow.querySelector("progress")
    const targetDownloadedTimeUrl = targetRow.querySelector(".downloadedTimeUrl")

    targetProgress.classList.add("done")
    targetProgress.value = 100
    targetDownloadedTimeUrl.textContent = new Date().toLocaleString()

    subscriptionRecords[id]["downloaded"] = true
    subscriptionRecords[id]["downloadedTime"] = targetDownloadedTimeUrl.textContent
    localStorage.setItem("subscriptions", JSON.stringify(subscriptionRecords))

    new Notification(
        `订阅"${subscriptionRecords[id]["name"]}"已完成下载`,
        { body: `详情：${subscriptionRecords[id]["pageUrl"]}` }
    )
})

window.electronAPI.onDownloadProgressUpdate((event, id, value)=>{
    const targetRow = document.getElementById(id)
    const targetProgress = targetRow.querySelector("progress")

    targetProgress.value = value
})

function selectHandler(elementsList, selectedElement) {
    elementsList.forEach((elem)=> {
        elem.classList.remove("selected")
    })
    selectedElement.classList.add("selected")
}

function initSubscriptionCallback() {
    for (const elem of subscriptionDeleteButtons) {
        elem.addEventListener("click", ()=>{
            const subscriptionId = elem.parentElement.parentElement.parentElement.getAttribute("id")

            elem.parentElement.parentElement.parentElement.remove()

            window.electronAPI.deleteTorrent(subscriptionId, cleanDeleteCheckbox.checked)

            delete subscriptionRecords[subscriptionId]

            localStorage.setItem("subscriptions", JSON.stringify(subscriptionRecords))
        })
    }
    for (const elem of downloadedTimeUrl) {
        elem.addEventListener("click", (event)=>{
            const pageUrl = elem.getAttribute("href")
            event.preventDefault()
            window.electronAPI.openUrlWithExternal(pageUrl)
        })
    }
}

function appendSubscription(id, name, keywords, downloadedTime, url, downloaded) {
    let nonemptyKeywords = []
    let keywordListHtml = "";

    for(const keyword of keywords) {
        if (keyword !== '' && keyword !== undefined && keyword !== null) {
            keywordListHtml += `<div class="keyword">${keyword}</div>`
            nonemptyKeywords.push(keyword)
        }
    }

    if(name === undefined) {
        name = nonemptyKeywords[0]
    }

    const downloadedHtmlClass = downloaded ? "done" : ""
    const startValue = downloaded ? 100 : 0

    subscriptionsTable.innerHTML +=
        `
            <div id="${id}" class="subscriptionRow">
                <div class="subscriptionCell name">${name}</div>
                <div class="subscriptionCell keywords">
                    <div class="keywordList">
                        ${keywordListHtml}
                    </div>
                </div>
                <div class="subscriptionCell progress">
                    <progress class="subscriptionProgressbar ${downloadedHtmlClass}" value=${startValue} max="100">                
                    </progress>
                </div>
                <div class="subscriptionCell downloadedTime">
                    <a href="${url}" class="downloadedTimeUrl clickable">${downloadedTime}</a>
                </div>
                <div class="subscriptionCell operations">
                    <div class="subscriptionOperations">
                        <button class="subscriptionDeleteButton clickable">×</button>
                    </div>
                </div>
            </div>
            `
}

async function updateSchedule() {
    let warningList = []
    for (const id in subscriptionRecords) {
        const {pageUrl, torrentUrl, status} = await window.electronAPI.updateWithKeywords(subscriptionRecords[id]["keywords"])

        const {isSuccess, warning} = handleUpdateStatus(status, subscriptionRecords[id]["name"])

        if (isSuccess) {
            if ((!subscriptionRecords[id]["downloaded"]) || torrentUrl !== subscriptionRecords[id]["torrentUrl"]) {
                const targetRow = document.getElementById(id)
                const targetProgress = targetRow.querySelector("progress")
                const targetDownloadedTimeUrl = targetRow.querySelector(".downloadedTimeUrl")

                targetProgress.classList.remove("done")
                targetProgress.value = 0
                targetDownloadedTimeUrl.textContent = "----/--/-- --:--:--"
                targetDownloadedTimeUrl.href = pageUrl

                window.electronAPI.download(torrentUrl, downloadPathLabel.textContent,
                    subscriptionRecords[id]["name"], id)

                subscriptionRecords[id]["url"] = pageUrl
                subscriptionRecords[id]["torrentUrl"] = torrentUrl
                subscriptionRecords[id]["downloaded"] = false
                subscriptionRecords[id]["downloadedTime"] = "----/--/-- --:--:--"

                localStorage.setItem("subscriptions", JSON.stringify(subscriptionRecords))
            }
        }
        else {
            warningList.push(warning)
        }
    }

    if (warningList.length > 0) {
        let warningContent = ""
        for (const warning of warningList) {
            warningContent += warning+"\n"
        }
        window.electronAPI.openWarningDialog(warningContent)
    }

    lastAppRunningTimestamp = Date.now()
    localStorage.setItem("lastAppRunningTimestamp", lastAppRunningTimestamp)
}

function handleUpdateStatus(status, name) {
    switch (status) {
        case 0:
            return { isSuccess: true, warning: "" }
        case 1:
            return { isSuccess: false, warning: `订阅"${name}"的搜索结果为空\n` }
        case 2:
            return { isSuccess: false, warning: `订阅"${name}"更新时发生网络错误\n` }
    }
}

function checkClearTodayAtLaunch() {
    let currentDate = new Date()
    let lastAppRunningDate = new Date(lastAppRunningTimestamp)

    let currentDayBasedTimestamp = currentDate.getHours() * 60 + currentDate.getMinutes()
    let lastAppRunningDayBasedTimestamp = lastAppRunningDate.getHours() * 60 + lastAppRunningDate.getMinutes()
    let clearTodayDayBasedTimestamp = clearTodayHour.value * 60 + clearTodayMinute.value

    if(inTheSameDay(currentDate, lastAppRunningDate)) {
        if ((lastAppRunningDayBasedTimestamp < clearTodayDayBasedTimestamp) && (clearTodayDayBasedTimestamp < currentDayBasedTimestamp)) {
            window.electronAPI.clearToday(downloadPathLabel.textContent)
        }
    }
    else {
        if (currentDayBasedTimestamp - lastAppRunningDayBasedTimestamp >= 24 * 60) {
            window.electronAPI.clearToday(downloadPathLabel.textContent)
        }
        else {
            if (lastAppRunningDayBasedTimestamp < clearTodayDayBasedTimestamp) {
                window.electronAPI.clearToday(downloadPathLabel.textContent)
            }
            else {
                if(currentDayBasedTimestamp > clearTodayDayBasedTimestamp) {
                    window.electronAPI.clearToday(downloadPathLabel.textContent)
                }
            }
        }
    }
}

function hourToMs(hour) {
    return hour * 60 * 60 * 1000;
}

function inTheSameDay(dateA, dateB) {
    return (dateA.getDay() === dateB.getDay()) && (dateA.getMonth() === dateB.getMonth()) && dateA.getFullYear() === dateB.getFullYear()
}