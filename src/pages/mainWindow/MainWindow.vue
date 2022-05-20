<template>
  <div id="app">
    <div id="tabMenu">
      <TabSelector
          @click="currentTab='SubscriptionsTab'"
          :isSelected="currentTab==='SubscriptionsTab'"
          text="订阅"
      />
      <TabSelector
          @click="currentTab='DownloadsTab'"
          :isSelected="currentTab==='DownloadsTab'"
          text="下载"
      />
      <TabSelector
          @click="currentTab='SettingsTab'"
          :isSelected="currentTab==='SettingsTab'"
          text="设置"
      />
    </div>
    <div id="functionality">
      <div id="windowControlBar">
        <MinimizeButton />
        <CloseButton />
      </div>
      <div id="windowCurrentComponent">
        <component :is="tabs[currentTab]" />
      </div>
    </div>
  </div>
</template>

<script setup>
import CloseButton from "@/components/CloseAppButton";
import MinimizeButton from "@/components/MinimizeButton";
import SubscriptionsTab from "@/components/SubscriptionsTab";
import SettingsTab from "@/components/SettingsTab";
import TabSelector from "@/components/TabSelector";
import DownloadsTab from "@/components/DownloadsTab"
import {ref, toRaw, watch} from "vue";
import {hourToMs, inTheSameDay} from "@/js/globalFuntions";
import {settings, subscriptions, lastAppRunningTimestamp, downloads} from "@/js/sharedState";

let updateIntervalId
const tabs = {SubscriptionsTab, DownloadsTab, SettingsTab}
const currentTab = ref('SubscriptionsTab')

window.electronAPI.onSubscriptionReady(async (event, id, keywords, pageUrl, torrentUrl) => {
  if (id in subscriptions) {
    if (pageUrl !== subscriptions[id]["pageUrl"]) {
      subscriptions[id]["pageUrl"] = pageUrl
      subscriptions[id]["updateTime"] = new Date().toLocaleString()

      window.electronAPI.addTorrent(id, torrentUrl, false, true, toRaw(subscriptions[id]['path']))
    }
  }
  else {
    let name = keywords[0];

    subscriptions[id] = {
      name,
      "path": await window.electronAPI.pathJoin(settings.subscriptionPath, name),
      "keywords": keywords,
      "updateTime": new Date().toLocaleString(),
      pageUrl,
    }

    window.electronAPI.addTorrent(id, torrentUrl, false, true, toRaw(subscriptions[id]['path']))
  }
})

window.electronAPI.onTorrentReady((event, id, name, torrent, progress, size, path, fromSubscription)=>{
  if (id in downloads) {
    progress = downloads[id]['progress']
  }
  downloads[id] = {
    name,
    torrent,
    progress,
    size,
    path,
    fromSubscription
  }
})

window.electronAPI.onTorrentProgress((event, id, progress)=>{
  if (progress < 1) {
    downloads[id]["progress"] = progress
  }
})

window.electronAPI.onTorrentDone((event, id)=>{
  if (downloads[id]["progress"] < 1) {
    downloads[id]["progress"] = 1

    new Notification(
        `"${downloads[id]["name"]}"已完成下载`,
        { body: `位置：${downloads[id]["path"]}` }
    )
  }
})

initClearToday()

initDownloads()

// init subscriptions
updateSubscriptions()
updateIntervalId = setInterval(updateSubscriptions, hourToMs(settings.pollingInterval))
watch(()=>settings.pollingInterval, (newInterval)=>{
  clearInterval(updateIntervalId)
  updateIntervalId = setInterval(updateSubscriptions, hourToMs(newInterval))
})

function initClearToday() {
  let currentDate = new Date()
  let lastAppRunningDate = new Date(lastAppRunningTimestamp.value)

  let currentDayBasedTimestamp = currentDate.getHours() * 60 + currentDate.getMinutes()
  let lastAppRunningDayBasedTimestamp = lastAppRunningDate.getHours() * 60 + lastAppRunningDate.getMinutes()
  let clearTodayDayBasedTimestamp = settings.clearTodayTime.hour * 60 + settings.clearTodayTime.minute

  if(inTheSameDay(currentDate, lastAppRunningDate)) {
    if ((lastAppRunningDayBasedTimestamp < clearTodayDayBasedTimestamp) && (clearTodayDayBasedTimestamp < currentDayBasedTimestamp)) {
      window.electronAPI.clearToday(toRaw(settings.subscriptionPath))
    }
  }
  else {
    if (currentDayBasedTimestamp - lastAppRunningDayBasedTimestamp >= 24 * 60) {
      window.electronAPI.clearToday(toRaw(settings.subscriptionPath))
    }
    else {
      if (lastAppRunningDayBasedTimestamp < clearTodayDayBasedTimestamp) {
        window.electronAPI.clearToday(toRaw(settings.subscriptionPath))
      }
      else {
        if(currentDayBasedTimestamp > clearTodayDayBasedTimestamp) {
          window.electronAPI.clearToday(toRaw(settings.subscriptionPath))
        }
      }
    }
  }

  window.electronAPI.setClearTodayTime(
      toRaw(settings.clearTodayTime.hour), toRaw(settings.clearTodayTime.minute), toRaw(settings.subscriptionPath)
  )
}

function initDownloads() {
  for (const id in downloads) {
    window.electronAPI.addTorrent(id, toRaw(downloads[id]["torrent"]), true, downloads[id]["fromSubscription"], toRaw(downloads[id]['path']))
  }
}

async function updateSubscriptions() {
  for (const id in subscriptions) {
    window.electronAPI.updateSubscription(id, toRaw(subscriptions[id]["keywords"]))
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

#windowCurrentComponent {
  height: 95%;
  width: 100%;
}
</style>
