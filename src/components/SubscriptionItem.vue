<template>
  <div class="subscriptionItem">
    <div class="subscriptionCell name">{{ name }}</div>
    <div class="subscriptionCell keywords">
      <div class="keywordList">
        <SubscriptionKeyword
            v-for="(keyword, index) of props.keywords"
            :keyword="keyword"
            :key="index"
        />
      </div>
    </div>
    <div class="subscriptionCell progress">
      <ProgressBar :progress="subscriptions[props.subscriptionId]['progress']" />
    </div>
    <div class="subscriptionCell downloadedTime">
      <a :href="props.url" @click="onUrlClick" class="downloadedTimeUrl clickable">{{ downloadedTime }}</a>
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
import ProgressBar from "@/components/ProgressBar";
import SubscriptionKeyword from "@/components/SubscriptionKeyword";
import {subscriptions} from "@/js/sharedState";

defineEmits(['delete'])

const props = defineProps(["name", "url", "downloadedTime", "keywords", "subscriptionId"])

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

.subscriptionCell.downloadedTime {
  width: 10%;
  text-align: center;
}

.subscriptionCell.progress {
  width: 20%;
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

.downloadedTimeUrl {
  color: indianred;
}

.downloadedTimeUrl:visited {
  color: indianred;
}
</style>