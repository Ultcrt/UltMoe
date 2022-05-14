<template>
<div class="pathPicker">
  <label id="downloadPathLabel" for="pathButton" >{{ path }}</label>
  <button
      @click="onDownloadPathButtonClick"
      id="pathButton"
      class="clickable"
  >浏览</button>
</div>
</template>

<script setup>
import {ref, defineProps, defineEmits} from "vue";

const props = defineProps(["defaultPath"])
const emit = defineEmits(["submit"])

const path = ref(props.defaultPath)

async function onDownloadPathButtonClick() {
  const newPath = await window.electronAPI.openDirectoryPicker()

  if(newPath !== undefined) {
    path.value = newPath
    emit("submit", path.value)
  }
}
</script>

<style scoped>
.pathPicker {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  width: 70%;
}

#downloadPathLabel {
  width: 90%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  text-align: right;
  background-color: white;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}

#pathButton {
  width: 10%;
  height: 100%;
  border: none;
  color: whitesmoke;
  background-color: grey;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
}

#pathButton:active {
  background-color: indianred;
}
</style>