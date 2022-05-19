<template>
  <div class="subscriptionsTab">
    <div id="subscriptionsTableArea" class="banDrag">
      <div id="subscriptionsTable">
        <SubscriptionItem
            v-for="(value, key, index) in subscriptions"
            :key="index"
            :subscriptionId="key"
            @delete="onDelete"
        />
      </div>
    </div>
    <div id="subscriptionCreateArea">
      <label for="subscriptionInput">关键字：</label>
      <InputWithSubmitButton id="subscriptionInput" placeHolder="以空格分隔每个关键词（第一个关键词为订阅名）" @submit="onKeywordsSubmit" />
    </div>
  </div>
</template>

<script setup>
import SubscriptionItem from "@/components/SubscriptionItem";
import InputWithSubmitButton from "@/components/InputWithSubmitButton";
import {subscriptions} from "@/js/sharedState";

async function onKeywordsSubmit(text) {
  if (text.trim() !== "") {
    const id = Date.now().toString()
    const keywords = text.trim().split(" ")
    const nonemptyKeywords = []

    for (const keyword of keywords) {
      if (keyword !== '' && keyword !== undefined && keyword !== null) {
        nonemptyKeywords.push(keyword)
      }
    }

    window.electronAPI.updateSubscription(id, nonemptyKeywords)
  }
  else {
    window.electronAPI.openWarningDialog("UltMoe", "关键字不能为空")
  }
}

function onDelete(targetId) {
  delete subscriptions[targetId]
}
</script>

<style scoped>
.subscriptionsTab {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

#subscriptionsTableArea {
  background-color: lightgrey;
  width: 90%;
  height: 90%;
  border-radius: 10px;
  display: block;
  overflow-y: auto;
}

#subscriptionsTable {
  width: 100%;
  height: 100%;
  display: table;
  table-layout: fixed;
}

#subscriptionCreateArea {
  height: 10%;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}
</style>