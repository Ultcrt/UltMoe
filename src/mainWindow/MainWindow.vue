<template>
  <div id="app">
    <div id="tabMenu">
      <TabSelector @click="currentTab='SubscriptionsTab'" text="订阅"/>
      <TabSelector @click="currentTab='SettingsTab'" text="设置"/>
    </div>
    <div id="functionality">
      <div id="windowControlBar">
        <MinimizeButton />
        <CloseButton />
      </div>
      <component :is="tabs[currentTab]" />
    </div>
  </div>
</template>

<script setup>
import CloseButton from "@/components/CloseAppButton";
import MinimizeButton from "@/components/MinimizeButton";
import SubscriptionsTab from "@/components/SubscriptionsTab";
import SettingsTab from "@/components/SettingsTab";
import TabSelector from "@/components/TabSelector";
import {ref, toRaw, watch} from "vue";
import {
  getLastAppRunningTimestamp,
  handleUpdateStatus, hourToMs,
  inTheSameDay
} from "@/js/globalFuntions";
import {settings, subscriptions, lastAppRunningTimestamp} from "@/js/sharedState";

let updateIntervalId
const tabs = {SubscriptionsTab, SettingsTab}
const currentTab = ref('SubscriptionsTab')

lastAppRunningTimestamp.value = Date.now()

checkClearTodayAtLaunch()

updateSchedule()
updateIntervalId = setInterval(updateSchedule, hourToMs(settings.pollingInterval))

watch(()=>settings.pollingInterval, (newInterval)=>{
  clearInterval(updateIntervalId)
  updateIntervalId = setInterval(updateSchedule, hourToMs(newInterval))
})

window.electronAPI.onDownloadDone((event, id)=>{
  subscriptions[id]["progress"] = 100
  subscriptions[id]["downloadedTime"] = new Date().toLocaleString()

  new Notification(
      `订阅"${subscriptions[id]["name"]}"已完成下载`,
      { body: `详情：${subscriptions[id]["pageUrl"]}` }
  )
})

window.electronAPI.onDownloadProgressUpdate((event, id, value)=>{
  subscriptions[id]["progress"] = value
})

function checkClearTodayAtLaunch() {
  const lastAppRunningTimestamp = getLastAppRunningTimestamp()
  let currentDate = new Date()
  let lastAppRunningDate = new Date(lastAppRunningTimestamp)

  let currentDayBasedTimestamp = currentDate.getHours() * 60 + currentDate.getMinutes()
  let lastAppRunningDayBasedTimestamp = lastAppRunningDate.getHours() * 60 + lastAppRunningDate.getMinutes()
  let clearTodayDayBasedTimestamp = settings.clearTodayTime.hour * 60 + settings.clearTodayTime.minute

  if(inTheSameDay(currentDate, lastAppRunningDate)) {
    if ((lastAppRunningDayBasedTimestamp < clearTodayDayBasedTimestamp) && (clearTodayDayBasedTimestamp < currentDayBasedTimestamp)) {
      window.electronAPI.clearToday(toRaw(settings.downloadPath))
    }
  }
  else {
    if (currentDayBasedTimestamp - lastAppRunningDayBasedTimestamp >= 24 * 60) {
      window.electronAPI.clearToday(toRaw(settings.downloadPath))
    }
    else {
      if (lastAppRunningDayBasedTimestamp < clearTodayDayBasedTimestamp) {
        window.electronAPI.clearToday(toRaw(settings.downloadPath))
      }
      else {
        if(currentDayBasedTimestamp > clearTodayDayBasedTimestamp) {
          window.electronAPI.clearToday(toRaw(settings.downloadPath))
        }
      }
    }
  }

  window.electronAPI.setClearTodayTime(
      toRaw(settings.clearTodayTime.hour), toRaw(settings.clearTodayTime.minute), toRaw(settings.downloadPath)
  )
}

async function updateSchedule() {
  let warningList = []
  for (const id in subscriptions) {
    const {pageUrl, torrentUrl, status} = await window.electronAPI.updateWithKeywords(
        toRaw(subscriptions[id]["keywords"])
    )

    const {isSuccess, warning} = handleUpdateStatus(status, subscriptions[id]["name"])

    if (isSuccess) {
      if ((subscriptions[id]["progress"] < 100) || torrentUrl !== subscriptions[id]["torrentUrl"]) {
        window.electronAPI.download(torrentUrl, toRaw(settings.downloadPath), toRaw(subscriptions[id]["name"]), id)

        subscriptions[id]["url"] = pageUrl
        subscriptions[id]["torrentUrl"] = torrentUrl
        subscriptions[id]["progress"] = 0
        subscriptions[id]["downloadedTime"] = "----/--/-- --:--:--"

        localStorage.setItem("subscriptions", JSON.stringify(subscriptions))
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

  lastAppRunningTimestamp.value = Date.now()
}
</script>

<style src="@/css/globalStyles.css"></style>

<style scoped>
#app {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 1000px;
  height: 600px;
  text-align: center;
  background-color: whitesmoke;
  border-radius: 10px;
  border: 1px grey solid;
  -webkit-app-region: drag;
}

#tabMenu {
  width: 20%;
  height: 100%;
  background-color: lightgrey;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-bottom-left-radius: 10px;
  border-top-left-radius: 10px;
}

#functionality {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  width: 80%;
  height: 100%;
}

#windowControlBar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  width: 10%;
  height: 5%;
}
</style>
