<template>
  <div id="app">
    <div id="topMenu">
      <label id="windowTitle">{{ dialogTitle }}</label>
      <div id="windowControlBar">
        <CloseDialogButton />
      </div>
    </div>
    <div id="messageArea">
      <label id="warningIcon">⚠</label>
      <p id="messageBox" class="banDrag">
        <span v-html="dialogBody"/>
      </p>
    </div>
  </div>
</template>

<script setup>
import CloseDialogButton from "@/components/CloseDialogButton";
import {ref} from "vue";

const dialogTitle = ref("")
const dialogBody = ref("")

window.electronAPI.dialogLoaded()

window.electronAPI.onInitTextContent((event, title, body)=>{
  dialogTitle.value = title
  dialogBody.value = body
})
</script>

<style src="@/css/globalStyles.css"></style>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 400px;
  height: 200px;
  text-align: center;
  background-color: whitesmoke;
  border-radius: 10px;
  border: 1px grey solid;
  -webkit-app-region: drag;
}

#topMenu {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 15%;
  background-color: indianred;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}

#windowTitle {
  width: 30%;
  font-size: 15px;
  text-align: left;
  line-height: 30px;
  margin-left: 10px;
  color: whitesmoke;
}

#windowControlBar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  width: 10%;
}

#messageArea {
  height: 85%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
}

#warningIcon {
  font-size: 100px;
  height: 90%;
  width: 40%;
  color: darkorange;
}

#messageBox {
  width: 70%;
  height: 80%;
  text-align: left;
  word-wrap: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 10px;
  color: chocolate;
  overflow-y: auto;
}
</style>
