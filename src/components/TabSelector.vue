<template>
  <div class="tabSelector" :class="props.isSelected ? 'selected':''">
    <button class="tabButton clickable">{{ props.text }}</button>
    <div class="tabIndicator clickable"></div>
  </div>
</template>

<script setup>
import {defineProps} from "vue";

const props = defineProps(['text', 'isSelected'])
</script>

<style scoped>
.tabSelector {
  height: 12%;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.tabButton {
  width: 95%;
  height: 75%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  border: none;
  background-color: transparent;
}

.tabIndicator {
  background-color: grey;
  width: 3%;
  height: 75%;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}

.tabSelector.selected>.tabIndicator {
  background-color: indianred;
}

.tabSelector.selected>.tabButton {
  background-color: whitesmoke;
}
</style>