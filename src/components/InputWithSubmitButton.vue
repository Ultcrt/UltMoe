<template>
  <input class="subscriptionInput typeArea" type="text" v-model="text" :placeholder="props.placeHolder"/>
  <button @click="onSubmitButtonClick" class="subscriptionSubmitButton clickable">+</button>
</template>

<script setup>
import {defineEmits, defineProps, ref} from "vue";

const emit = defineEmits(['submit'])
const props = defineProps(["placeHolder"])
const text = ref("")

function onSubmitButtonClick() {
  emit('submit', text.value)
  text.value = ""
}
</script>

<style scoped>
.subscriptionInput {
  width: 70%;
  height: 50%;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
  border: none;
}

.subscriptionInput:focus {
  outline-color: indianred;
}

.subscriptionSubmitButton {
  width: 5%;
  height: 50%;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  background-color: grey;
  color: whitesmoke;
  border: none;
}

.subscriptionSubmitButton:active {
  background-color: indianred;
  color: whitesmoke;
}
</style>