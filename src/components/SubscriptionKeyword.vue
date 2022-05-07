<template>
  <div class="keyword">{{ props.keyword }}</div>
</template>

<script setup>
import {defineProps} from "vue";

const props = defineProps(["keyword"])
</script>

<style scoped>
.keyword {
  background-color: indianred;
  color: whitesmoke;

  height: 20px;
  border-radius: 15px;
  margin: 2px;
  padding: 5px;

  line-height: 20px;
  text-align: center;

  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>