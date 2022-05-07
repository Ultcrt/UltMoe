<template>
  <button @click="quit" class="closeButton clickable">×</button>
</template>

<script setup>
function quit() {
  window.electronAPI.closeDialog()
}
</script>

<style scoped>
.closeButton {
  font-size: 25px;
  color: whitesmoke;
  border: none;
  background-color: transparent;
  width: 30px;
  height: 30px;
  line-height: 30px;
}

.closeButton:active {
  color: grey;
}
</style>