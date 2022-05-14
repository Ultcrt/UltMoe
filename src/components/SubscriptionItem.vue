<template>
  <div class="subscriptionItem">
    <div class="subscriptionCell name">{{ subscriptions[props.subscriptionId]['name'] }}</div>
    <div class="subscriptionCell keywords">
      <div class="keywordList">
        <StyledLabel
            v-for="(keyword, index) of subscriptions[props.subscriptionId]['keywords']"
            :text="keyword"
            :key="index"
        />
      </div>
    </div>
    <div class="subscriptionCell updateTime">
      <a
          :href="subscriptions[props.subscriptionId]['pageUrl']"
          @click="onUrlClick"
          class="updateTimeUrl clickable"
      >{{ subscriptions[props.subscriptionId]['updateTime'] }}</a>
    </div>
    <div class="subscriptionCell operations">
      <div class="subscriptionOperations">
        <DeleteButton @delete="$emit('delete', props.subscriptionId)"/>
      </div>
    </div>
  </div>
</template>

<script setup>
import {defineEmits, defineProps} from "vue";
import DeleteButton from "@/components/DeleteButton";
import StyledLabel from "@/components/StyledLabel";
import {subscriptions} from "@/js/sharedState";

defineEmits(['delete'])

const props = defineProps(["subscriptionId"])

function onUrlClick(event) {
  event.preventDefault()
  const pageUrl = event.target.href
  window.electronAPI.openUrlWithExternal(pageUrl)
}
</script>

<style scoped>
.subscriptionItem {
  display: table-row;
}

.subscriptionCell {
  display: table-cell;
  vertical-align: middle;
  border-top: 15px lightgrey solid;
  border-bottom: 15px lightgrey solid;
  border-right: 10px lightgrey solid;
  border-left: 10px lightgrey solid;
}

.subscriptionCell.name {
  width: 15%;
}

.subscriptionCell.updateTime {
  width: 25%;
  text-align: center;
}

.subscriptionCell.operations {
  width: 5%;
}

.keywordList {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}

.updateTimeUrl {
  color: indianred;
}

.updateTimeUrl:visited {
  color: indianred;
}

.subscriptionOperations {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}
</style>