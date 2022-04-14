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

const subscriptionDeleteButtons = document.getElementsByClassName("subscriptionDeleteButton")
const updateTimeUrl = document.getElementsByClassName("updateTimeUrl")

let subscriptionRecords = {}
let settingRecords = {
    "runAtStartup": false,
    "pollingInterval": 5,
    "downloadPath": "./Download"
}

if (localStorage.getItem("subscriptions")) {
    subscriptionRecords = JSON.parse(localStorage.getItem("subscriptions"))

    for(const key in subscriptionRecords) {
        appendSubscription(subscriptionRecords[key]["name"], subscriptionRecords[key]["keywords"],
            subscriptionRecords[key]["updateTime"], subscriptionRecords[key]["url"], key)
    }
}

if (localStorage.getItem("settings")) {
    settingRecords = JSON.parse(localStorage.getItem("settings"))

    runAtStartupCheckbox.checked = settingRecords["runAtStartup"]
    pollingIntervalNumber.value = settingRecords["pollingInterval"]
    downloadPathLabel.textContent = settingRecords["downloadPath"]
}

updateSchedule()
let updateTimeId = setInterval(updateSchedule, hourToMs(pollingIntervalNumber.value))

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

        let name = keywords[0];

        const {url, torrent} = await window.electronAPI.updateWithKeywords(keywords)

        window.electronAPI.download(torrent, downloadPathLabel.textContent, name)

        const currentTimestamp = Date.now()

        const currentDatetime = new Date(currentTimestamp).toLocaleString()

        appendSubscription(name, keywords, currentDatetime, url, currentTimestamp)

        subscriptionRecords[currentTimestamp.toString()] = {
            "name": name,
            "keywords": keywords,
            "updateTime": currentDatetime,
            "url": url,
            "torrent": torrent
        }

        localStorage.setItem("subscriptions", JSON.stringify(subscriptionRecords))

        initSubscriptionCallback()
    }
})

runAtStartupCheckbox.addEventListener("click", ()=>{

    settingRecords["runAtStartup"] = runAtStartupCheckbox.checked

    localStorage.setItem("settings", JSON.stringify(settingRecords))
})

pollingIntervalNumber.addEventListener("change", ()=>{
    if (pollingIntervalNumber.value < 1) {
        pollingIntervalNumber.value = 1
    }
    else if(pollingIntervalNumber.value > 24) {
        pollingIntervalNumber.value = 24
    }

    clearInterval(updateTimeId)

    updateTimeId = setInterval(updateSchedule, hourToMs(pollingIntervalNumber.value))

    settingRecords["pollingInterval"] = pollingIntervalNumber.value

    localStorage.setItem("settings", JSON.stringify(settingRecords))
})

downloadPathButton.addEventListener("click", async ()=>{
    downloadPathLabel.textContent = await window.electronAPI.openDirectoryPicker()

    settingRecords["downloadPath"] = downloadPathLabel.textContent

    localStorage.setItem("settings", JSON.stringify(settingRecords))
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

            delete subscriptionRecords[subscriptionId]

            localStorage.setItem("subscriptions", JSON.stringify(subscriptionRecords))

            elem.parentElement.parentElement.parentElement.remove()
        })
    }
    for (const elem of updateTimeUrl) {
        elem.addEventListener("click", (event)=>{
            const url = elem.getAttribute("href")
            event.preventDefault()
            window.electronAPI.openUrlWithExternal(url)
        })
    }
}

function appendSubscription(name, keywords, updateTime, url, id) {
    let keywordListHtml = "";
    for(const keyword of keywords) {
        if (keyword) {
            keywordListHtml += `<div class="keyword">${keyword}</div>`
        }
    }

    subscriptionsTable.innerHTML +=
        `
            <div id="${id}" class="subscriptionRow">
                <div class="subscriptionCell name">${name}</div>
                <div class="subscriptionCell keywords">
                    <div class="keywordList">
                        ${keywordListHtml}
                    </div>
                </div>
                <div class="subscriptionCell updateTime">
                    <a href="${url}" class="updateTimeUrl clickable">${updateTime}</a>
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
    for (const key in subscriptionRecords) {
        const {url, torrent} = await window.electronAPI.updateWithKeywords(subscriptionRecords[key]["keywords"])

        window.electronAPI.download(torrent, downloadPathLabel.textContent, subscriptionRecords[key]["name"])

        subscriptionRecords[key]["url"] = url
        subscriptionRecords[key]["torrent"] = torrent

        localStorage.setItem("subscriptions", JSON.stringify(subscriptionRecords))
    }
}

function hourToMs(hour) {
    return hour * 60 * 60 * 1000;
}