<template>
  <div class="downloadItem">
    <div class="downloadCell name">
      <a
          :href="downloads[props.downloadId]['path']"
          @click="onUrlClick"
          class="downloadNameUrl clickable"
      >{{ downloads[props.downloadId]['name'] }}</a>
    </div>
    <div class="downloadCell progress">
      <div class="downloadProgress">
        <ProgressBar :progress="downloads[props.downloadId]['progress']" />
      </div>
    </div>
    <div class="downloadCell downloadSpeed">
      <LabelWithUnit :value="props.downloadSpeed.value" :unit="props.downloadSpeed.unit"/>
    </div>
    <div class="downloadCell uploadSpeed">
      <LabelWithUnit :value="props.uploadSpeed.value" :unit="props.uploadSpeed.unit"/>
    </div>
    <div class="downloadCell timeRemaining">
      <LabelWithUnit :value="props.timeRemaining.value" :unit="props.timeRemaining.unit"/>
    </div>
    <div class="downloadCell operations">
      <div class="downloadOperations">
        <PauseAndResumeButton @pause="onPause" @resume="onResume"/>
        <DeleteButton @delete="$emit('delete', props.downloadId)"/>
      </div>
    </div>
  </div>
</template>

<script setup>
import {defineEmits, defineProps, toRaw} from "vue";
import DeleteButton from "@/components/DeleteButton";
import ProgressBar from "@/components/ProgressBar";
import {downloads} from "@/js/sharedState";
import PauseAndResumeButton from "@/components/PauseAndResumeButton";
import LabelWithUnit from "@/components/LabelWithUnit";

const emit = defineEmits(['delete', 'pause'])

const props = defineProps(["downloadId", "downloadSpeed", "uploadSpeed", "timeRemaining"])

function onUrlClick(event) {
  event.preventDefault()
  const path = downloads[props.downloadId]['path']
  window.electronAPI.openPathWithExplorer(path)
}

function onPause() {
  window.electronAPI.pauseTorrent(props.downloadId)
  emit("pause", props.downloadId)
}

function onResume() {
  window.electronAPI.resumeTorrent(
      props.downloadId,
      toRaw(downloads[props.downloadId]["torrent"]),
      toRaw(downloads[props.downloadId]["fromSubscription"]),
      toRaw(downloads[props.downloadId]["path"])
  )
}
</script>

<style scoped>
.downloadItem {
  display: table-row;
}

.downloadCell {
  display: table-cell;
  vertical-align: middle;
  border-top: 15px lightgrey solid;
  border-bottom: 15px lightgrey solid;
  border-right: 10px lightgrey solid;
  border-left: 10px lightgrey solid;
}

.downloadProgress {
  height: 20px;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.downloadCell.name {
  width: 20%;
  text-align: center;
  font-size: 12px;
}

.downloadCell.progress {
  width: 20%;
  text-align: center;
}

.downloadCell.downloadSpeed {
  width: 15%;
  text-align: center;
}

.downloadCell.uploadSpeed {
  width: 15%;
  text-align: center;
}

.downloadCell.timeRemaining {
  width: 15%;
  text-align: center;
}

.downloadCell.operations {
  width: 15%;
  text-align: center;
}

.downloadNameUrl {
  color: indianred;
}

.downloadNameUrl:visited {
  color: indianred;
}

.downloadOperations {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
</style>