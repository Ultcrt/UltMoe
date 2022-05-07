<template>
  <div class="subscriptionTab">
    <div id="subscriptionsTableArea" class="banDrag">
      <div id="subscriptionsTable">
        <SubscriptionItem
            v-for="(value, key, index) in subscriptions"
            :key="index"
            :subscriptionId="key"
            :name="value['name']"
            :url="value['pageUrl']"
            :downloadedTime="value['downloadedTime']"
            :keywords="value['keywords']"
            @delete="onDelete"
        />
      </div>
    </div>
    <div id="subscriptionCreateArea">
      <label for="subscriptionInput">关键字：</label>
      <InputWithSubmitButton id="subscriptionInput" placeHolder="以空格分隔每个关键字" @submit="onKeywordsSubmit" />
    </div>
  </div>
</template>

<script setup>
import SubscriptionItem from "@/components/SubscriptionItem";
import InputWithSubmitButton from "@/components/InputWithSubmitButton";
import {handleUpdateStatus} from "@/js/globalFuntions"
import {settings, subscriptions} from "@/js/sharedState";
import {toRaw} from "vue";

async function onKeywordsSubmit(text) {
  if (text.trim() !== "") {
    const keywords = text.trim().split(" ")
    const nonemptyKeywords = []

    for(const keyword of keywords) {
      if (keyword !== '' && keyword !== undefined && keyword !== null) {
        nonemptyKeywords.push(keyword)
      }
    }

    if (nonemptyKeywords.length > 0) {
      const {pageUrl, torrentUrl, status} = await window.electronAPI.updateWithKeywords(nonemptyKeywords)
      const id = Date.now().toString()
      const nullDatetime = "----/--/-- --:--:--"
      let name = nonemptyKeywords[0];

      const {isSuccess, warning} = handleUpdateStatus(status, name)

      if (isSuccess) {
        subscriptions[id] = {
          "name": name,
          "keywords": nonemptyKeywords,
          "downloadedTime": nullDatetime,
          "pageUrl": pageUrl,
          "torrentUrl": torrentUrl,
          "progress": 0
        }

        window.electronAPI.download(torrentUrl, toRaw(settings.downloadPath), name, id)
      }
      else {
        window.electronAPI.openWarningDialog(warning)
      }
    }
  }
  else {
    window.electronAPI.openWarningDialog("关键字不能为空")
  }
}

function onDelete(targetId) {
  delete subscriptions[targetId]
  window.electronAPI.deleteTorrent(targetId, toRaw(settings.cleanDelete))
}
</script>

<style scoped>
.subscriptionTab {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
}

#subscriptionsTableArea {
  background-color: lightgrey;
  width: 93%;
  height: 92%;
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