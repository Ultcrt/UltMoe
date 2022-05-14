<template>
  <div class="labelWithUnit">
    <div class="value">{{ props.value }}</div>
    <div class="unit">{{ props.unit }}</div>
  </div>
</template>

<script setup>
import {defineProps} from "vue";

const props = defineProps(["value", "unit"])
</script>

<style scoped>
.labelWithUnit {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 20px;
  width: 100%;
}

.value {
  width: 60%;
  height: 100%;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
  background-color: indianred;
  color: white;
  line-height: 20px;
}

.unit {
  width: 40%;
  height: 100%;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  background-color: darkseagreen;
  color: black;
  font-size: 12px;
  line-height: 20px;
}
</style>