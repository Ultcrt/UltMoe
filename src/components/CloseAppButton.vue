<template>
  <button @click="quit" class="closeButton clickable">×</button>
</template>

<script setup>
function quit() {
  window.electronAPI.quit()
}
</script>

<style scoped>
.closeButton {
  font-size: 25px;
  color: grey;
  border: none;
  background-color: transparent;
  width: 30px;
  height: 30px;
  line-height: 30px;
}

.closeButton:active {
  color: indianred;
}
</style>