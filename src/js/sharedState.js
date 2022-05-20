import {reactive, ref, watch} from "vue";
import {getLastAppRunningTimestamp, getDownloads, getSettings, getSubscriptions} from "@/js/globalFuntions";

/*{
    "runAtStartup": false,
    "cleanDelete": false,
    "pollingInterval": 5,
    "clearTodayTime": { "hour": 0, "minute": 0},
    "downloadPath": "..."
    "subscriptionPath": "..."
}*/
export const settings = reactive(getSettings())

/*{
    "id": {
        "name": "...",
        "torrent": "...",
        "progress": 1.0,
        "size": 100.0,
        "path": "...",
        "fromSubscription": false
    }
}*/
export const downloads = reactive(getDownloads())

/*{
    "id": {
        "name": "...",
        "path": "...",
        "keywords": ["...", "..."],
        "pageUrl": "...",
        "updateTime": "...",
    }
}*/
export const subscriptions = reactive(getSubscriptions())

export const lastAppRunningTimestamp = ref(getLastAppRunningTimestamp())

watch(settings, (newSettings)=>{
    localStorage.setItem("settings", JSON.stringify(newSettings))
})

watch(downloads, (newDownloads)=>{
    localStorage.setItem("downloads", JSON.stringify(newDownloads))
})

watch(subscriptions, (newSubscriptions)=>{
    localStorage.setItem("subscriptions", JSON.stringify(newSubscriptions))
})

watch(lastAppRunningTimestamp, (newTimestamp)=>{
    localStorage.setItem("lastAppRunningTimestamp", newTimestamp)
})