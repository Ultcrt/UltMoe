<template>
  <div class="downloadsTab">
    <div id="downloadsTableArea" class="banDrag">
      <div id="downloadsTable">
        <DownloadItem
            v-for="(value, key, index) in downloads"
            :key="index"
            :downloadId="key"
            :downloadSpeed="info[key]['downloadSpeed']"
            :uploadSpeed="info[key]['uploadSpeed']"
            :timeRemaining="info[key]['timeRemaining']"
            :progress="info[key]['progress']"
            @delete="onDelete"
            @pause="onPause"
        />
      </div>
    </div>
    <div id="downloadCreateArea">
      <label for="downloadInput">链接：</label>
      <InputWithSubmitButton
          id="downloadInput"
          placeHolder="请输入磁链/种子http url/种子本地路径"
          @submit="onDownloadSubmit"
      />
    </div>
  </div>
</template>

<script setup>
import InputWithSubmitButton from "@/components/InputWithSubmitButton";
import DownloadItem from "@/components/DownloadItem";
import {downloads, settings} from "@/js/sharedState"
import {reactive, toRaw, watch} from "vue";

const info = reactive({})

updateInfo(downloads)
watch(downloads, updateInfo)

window.electronAPI.onTorrentTransmittingInfoUpdated((event, torrentTransmittingInfo)=>{
  for (let id in torrentTransmittingInfo) {
    if (id in info) {
      let result = getSpeedWithUnit(torrentTransmittingInfo[id]["downloadSpeed"])
      info[id]['downloadSpeed']["value"] = result.value
      info[id]['downloadSpeed']["unit"] = result.unit

      result = getSpeedWithUnit(torrentTransmittingInfo[id]["uploadSpeed"])
      info[id]['uploadSpeed']["value"] = result.value
      info[id]['uploadSpeed']["unit"] = result.unit

      result = getTimeWithUnit(torrentTransmittingInfo[id]["timeRemaining"])
      info[id]['timeRemaining']["value"] = result.value
      info[id]['timeRemaining']["unit"] = result.unit

      info[id]['progress'] = torrentTransmittingInfo[id]["progress"]

      if (downloads[id]["isDone"] && info[id]['progress'] < 1) {
        downloads[id]["isDone"] = false
      }
    }
  }
})

function getSpeedWithUnit(speed) {
  let unit = "B/s"
  if (speed / 1024 >= 0.7) {
    speed /= 1024
    unit = "KB/s"
    if (speed / 1024 >= 0.7) {
      speed /= 1024
      unit = "MB/s"
      if (speed / 1024 >= 0.7) {
        speed /= 1024
        unit = "GB/s"
      }
    }
  }

  return {"value": speed.toFixed(1), unit}
}

function getTimeWithUnit(time) {
  time /= 1000
  let unit = "s"
  if (time / 60 >= 1) {
    time /= 60
    unit = "m"
    if (time / 60 >= 1) {
      time /= 60
      unit = "h"
      if (time / 24 >= 1) {
        time /= 24
        unit = "d"
      }
    }
  }

  return {"value": time.toFixed(1), unit}
}

function updateInfo(newDownloads) {
  for (const id in newDownloads) {
    if (!(id in info)) {
      info[id] = {
        "downloadSpeed": {"value": "0.0", "unit": "B/s"},
        "uploadSpeed": {"value": "0.0", "unit": "B/s"},
        "timeRemaining": {"value": "0.0", "unit": "s"},
        "progress": downloads[id]["isDone"] ? 1 : 0
      }
    }
  }
}

function onDownloadSubmit(url) {
  const id = Date.now().toString()

  window.electronAPI.addTorrent(id, url, false, false,  toRaw(settings.downloadPath), undefined)
}

function onDelete(targetId) {
  delete downloads[targetId]
  window.electronAPI.deleteTorrent(targetId, toRaw(settings.cleanDelete))
}

function onPause(targetId) {
  info[targetId] = {
    "downloadSpeed": {"value": "0.0", "unit": "B/s"},
    "uploadSpeed": {"value": "0.0", "unit": "B/s"},
    "timeRemaining": {"value": "0.0", "unit": "s"},
    "progress": info[targetId]["progress"]
  }
}
</script>

<style scoped>
.downloadsTab {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

#downloadsTableArea {
  background-color: lightgrey;
  width: 90%;
  height: 90%;
  border-radius: 10px;
  display: block;
  overflow-y: auto;
}

#downloadsTable {
  width: 100%;
  height: 100%;
  display: table;
  table-layout: fixed;
}

#downloadCreateArea {
  height: 10%;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}
</style>