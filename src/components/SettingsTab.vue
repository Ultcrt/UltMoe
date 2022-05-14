<template>
  <div class="settingsTab">
    <div id="settingsArea">
      <div class="settingItem">
        <label for="runAtStartupCheckbox">开机启动</label>
        <input
            v-model="settings.runAtStartup"
            id="runAtStartupCheckbox" class="settingCheckbox clickable" type="checkbox"
        />
      </div>
      <div class="settingItem">
        <label for="cleanDeleteCheckbox">同时删除文件</label>
        <input
            v-model="settings.cleanDelete"
            id="cleanDeleteCheckbox" class="settingCheckbox clickable" type="checkbox"
        />
      </div>
      <div class="settingItem">
        <label for="pollingIntervalNumber">查询间隔（小时）</label>
        <input
            :value="settings.pollingInterval"
            @input="onIntervalInput"
            id="pollingIntervalNumber" class="settingNumber typeArea" type="number"
        />
      </div>
      <div class="settingItem">
        <label for="clearTodayHour">今日更新文件夹清空时间</label>
        <TimeInput
            @timeChange="onTimeChange"
            :hour="settings.clearTodayTime.hour"
            :minute="settings.clearTodayTime.minute"
        />
      </div>
      <div class="settingItem">
        <label for="downloadPathPicker">下载路径</label>
        <PathPicker id="downloadPathPicker" :defaultPath="settings.downloadPath" @submit="onDownloadPathSubmit"/>
      </div>
      <div class="settingItem">
        <label for="subscriptionPathPicker">订阅路径</label>
        <PathPicker id="subscriptionPathPicker" :defaultPath="settings.subscriptionPath" @submit="onSubscriptionPathSubmit"/>
      </div>
    </div>
  </div>
</template>

<script setup>
import TimeInput from "@/components/TimeInput";
import {toRaw, watch} from "vue";
import {settings} from "@/js/sharedState";
import PathPicker from "@/components/PathPicker";

watch(()=>settings.runAtStartup, (flag)=>{
  window.electronAPI.setRunAtStartup(flag)
})

function onIntervalInput(event){
  if (event.target.value < 1) {
    event.target.value = 1
  }
  else if(event.target.value > 24) {
    event.target.value = 24
  }

  settings.pollingInterval = event.target.value
}

function onTimeChange(hour, minute) {
  settings.clearTodayTime.hour = hour
  settings.clearTodayTime.minute = minute
  window.electronAPI.setClearTodayTime(hour, minute, toRaw(settings.subscriptionPath))
}

function onDownloadPathSubmit(path) {
  settings.downloadPath = path
}

function onSubscriptionPathSubmit(path) {
  settings.subscriptionPath = path
}
</script>

<style scoped>
.settingsTab {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
}

#settingsArea {
  width: 70%;
  height: 92%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
}

.settingItem {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  margin-bottom: 10px;
}

.settingCheckbox {
  accent-color: indianred;
}

.settingNumber {
  height: 20px;
  width: 40px;
  border: none;
  border-radius: 10px;
  text-align: center;
}

.settingNumber:focus {
  outline-color: indianred;
}
</style>