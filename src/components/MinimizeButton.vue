<template>
  <button @click="minimize" class="minimizeButton clickable">-</button>
</template>

<script setup>
function minimize() {
  window.electronAPI.minimize()
}
</script>

<style scoped>
.minimizeButton {
  font-size: 25px;
  color: grey;
  border: none;
  background-color: transparent;
  width: 30px;
  height: 30px;
  line-height: 30px;
}

.minimizeButton:active {
  color: indianred;
}
</style>