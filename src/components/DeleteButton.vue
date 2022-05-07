<template>
  <button @click="$emit('delete')" class="deleteButton clickable">×</button>
</template>

<script setup>
import { defineEmits } from "vue";

defineEmits(['delete'])
</script>

<style scoped>
.deleteButton {
  border: none;
  background-color: transparent;
  font-size: 30px;
  color: red;
  border-radius: 10px;
  width: 30px;
  height: 30px;
  line-height: 30px;
}

.deleteButton:active {
  color: indianred;
}
</style>