import {reactive, ref, watch} from "vue";
import {getLastAppRunningTimestamp, getSettings, getSubscriptions} from "@/js/globalFuntions";

export const settings = reactive(getSettings())

export const subscriptions = reactive(getSubscriptions())

export const lastAppRunningTimestamp = ref(getLastAppRunningTimestamp())

watch(settings, (newSettings)=>{
    localStorage.setItem("settings", JSON.stringify(newSettings))
})

watch(subscriptions, (newSubscriptions)=>{
    localStorage.setItem("subscriptions", JSON.stringify(newSubscriptions))
})

watch(lastAppRunningTimestamp, (newTimestamp)=>{
    localStorage.setItem("lastAppRunningTimestamp", newTimestamp)
})