<template>
  <progress class="progressBar" :class="isDone" :value="props.progress * 100" max="100"></progress>
</template>

<script setup>
import {ref, defineProps, watch} from "vue";

const props = defineProps(["progress"])
const isDone = ref("")

isDoneCheck(props.progress)

watch(()=>props.progress, isDoneCheck)

function isDoneCheck(newProgress) {
  if (newProgress >= 1) {
    isDone.value = "done"
  }
  else {
    isDone.value = ""
  }
}
</script>

<style scoped>
.progressBar {
  height: 10px;
  width: 100%;
  margin-top: 5px;
  -webkit-appearance: none;
}

.progressBar::-webkit-progress-value {
  background-color: indianred;
  border-radius: 5px;
}

.progressBar::-webkit-progress-bar {
  background-color: white;
  border-radius: 5px;
}

.progressBar.done::-webkit-progress-value {
  background-color: darkseagreen;
}
</style>