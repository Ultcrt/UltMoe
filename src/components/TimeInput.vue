<template>
  <div class="timeInput">
    <input
        @change="onHourChange"
        :value="hourValue" class="timeNumberInput typeArea" type="number"
    />
    <label>:</label>
    <input
        @change="onMinuteChange"
        :value="minuteValue"  class="timeNumberInput typeArea" type="number"/>
  </div>
</template>

<script setup>
import {defineEmits, defineProps, ref} from "vue";

const props = defineProps(["hour", "minute"])
const emit = defineEmits(["timeChange"])
const hourValue = ref(props.hour)
const minuteValue = ref(props.minute)

function onHourChange(event) {
  if(event.target.value < 0) {
    event.target.value = 0
  }
  else if(event.target.value > 23) {
    event.target.value = 23
  }
  hourValue.value = event.target.value

  emit('timeChange', hourValue.value, minuteValue.value)
}

function onMinuteChange(event) {
  if(event.target.value < 0) {
    event.target.value = 0
  }
  else if(event.target.value > 59) {
    event.target.value = 59
  }
  minuteValue.value = event.target.value

  emit('timeChange', hourValue.value, minuteValue.value)
}
</script>

<style scoped>
.timeNumberInput {
  height: 20px;
  width: 40px;
  border: none;
  border-radius: 10px;
  text-align: center;
}

.timeNumberInput:focus {
  outline-color: indianred;
}
</style>