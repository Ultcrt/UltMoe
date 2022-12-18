<template>
  <button @click="onClick" class="pauseButton clickable" :class="state">{{ icon }}</button>
</template>

<script setup>
import {defineEmits, defineProps, ref} from "vue";

const props = defineProps(['default'])
const state = ref(props.default)
const emit = defineEmits(['pause', 'resume'])

let icon = ""
if (state.value === "resumed") {
  icon = "II"
}
else if(state.value === "paused") {
  icon  = "▶"
}

function onClick(event) {
  if (state.value === "resumed") {
    emit('pause')
    state.value = "paused"
    event.target.innerText  = "▶"
  }
  else if(state.value === "paused") {
    emit('resume')
    state.value = "resumed"
    event.target.innerText  = "II"
  }
}
</script>

<style scoped>
.pauseButton {
  border: none;
  background-color: transparent;
  font-size: 30px;
  border-radius: 10px;
  width: 30px;
  height: 30px;
  line-height: 30px;
}

.pauseButton.paused {
  color: darkseagreen;
}

.pauseButton.resumed {
  color: darkgrey;
}

.pauseButton:active {
  color: indianred;
}
</style>