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
const clearTodayTime = document.querySelector("#clearTodayTime")

const subscriptionDeleteButtons = document.getElementsByClassName("subscriptionDeleteButton")
const downloadedTimeUrl = document.getElementsByClassName("downloadedTimeUrl")

let subscriptionRecords = {}
let settingRecords = {
    "runAtStartup": false,
    "cleanDelete": false,
    "pollingInterval": 5,
    "clearTodayTime": "00:00",
    "downloadPath": "./Download"
}

if (localStorage.getItem("subscriptions")) {
    subscriptionRecords = JSON.parse(localStorage.getItem("subscriptions"))

    for(const key in subscriptionRecords) {
        appendSubscription(key, subscriptionRecords[key]["name"], subscriptionRecords[key]["keywords"],
            subscriptionRecords[key]["downloadedTime"], subscriptionRecords[key]["pageUrl"],
            subscriptionRecords[key]["downloaded"])
    }
}

if (localStorage.getItem("settings")) {
    settingRecords = JSON.parse(localStorage.getItem("settings"))

    runAtStartupCheckbox.checked = settingRecords["runAtStartup"]
    cleanDeleteCheckbox.checked = settingRecords["cleanDelete"]
    pollingIntervalNumber.value = settingRecords["pollingInterval"]
    clearTodayTime.value = settingRecords["clearTodayTime"]
    downloadPathLabel.textContent = settingRecords["downloadPath"]
}

updateSchedule()

window.electronAPI.setRunAtStartup(runAtStartupCheckbox.checked)
window.electronAPI.setClearTodayTime(clearTodayTime.value, downloadPathLabel.textContent)
let updateIntervalId = setInterval(updateSchedule, hourToMs(pollingIntervalNumber.value))

initSubscriptionCallback()

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
        const key = Date.now().toString()
        const nullDatetime = "----/--/-- --:--:--"
        let name = keywords[0];

        if (handleUpdateStatus(status, name)) {
            appendSubscription(key, undefined, keywords, nullDatetime, pageUrl, false)

            subscriptionRecords[key] = {
                "name": name,
                "keywords": keywords,
                "downloadedTime": nullDatetime,
                "pageUrl": pageUrl,
                "torrentUrl": torrentUrl,
                "downloaded": false
            }

            localStorage.setItem("subscriptions", JSON.stringify(subscriptionRecords))

            initSubscriptionCallback()

            window.electronAPI.download(torrentUrl, downloadPathLabel.textContent, name, key)

            subscriptionInput.value = ""
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

clearTodayTime.addEventListener("change", ()=>{
    window.electronAPI.setClearTodayTime(clearTodayTime.value, downloadPathLabel.textContent)

    settingRecords["clearTodayTime"] = clearTodayTime.value
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

    const downloadedHtml = downloaded ? "done" : ""
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
                    <progress class="subscriptionProgressbar ${downloadedHtml}" value=${startValue} max="100">                
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
    console.log("Hourly update")
    for (const key in subscriptionRecords) {
        const {url, torrentUrl, status} = await window.electronAPI.updateWithKeywords(subscriptionRecords[key]["keywords"])

        if (handleUpdateStatus(status, subscriptionRecords[key]["name"])) {
            if ((!subscriptionRecords[key]["downloaded"]) || torrentUrl !== subscriptionRecords[key]["torrentUrl"]) {
                window.electronAPI.download(torrentUrl, downloadPathLabel.textContent,
                    subscriptionRecords[key]["name"], key)

                subscriptionRecords[key]["url"] = url
                subscriptionRecords[key]["torrentUrl"] = torrentUrl

                localStorage.setItem("subscriptions", JSON.stringify(subscriptionRecords))
            }
        }
    }
}

function handleUpdateStatus(status, name) {
    switch (status) {
        case 0:
            return true
        case 1:
            window.electronAPI.openWarningDialog(`订阅"${name}"的搜索结果为空`)
            return false
        case 2:
            window.electronAPI.openWarningDialog(`订阅"${name}"更新时发生网络错误`)
            return false
    }
}

function hourToMs(hour) {
    return hour * 60 * 60 * 1000;
}