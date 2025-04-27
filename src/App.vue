<script setup lang="ts">
import { RouterView } from "vue-router";
import { useWebSocket } from "@vueuse/core";
import { onBeforeUnmount, onMounted, watch } from "vue";
import type { IMetricResponse } from "@/models/ContainerResponse.ts";
import { useAppStore } from "@/stores/useAppStore.ts";
const { status, data, send, open, close } = useWebSocket<IMetricResponse>(
  "ws://192.168.122.102:3011",
);

const appStore = useAppStore();

watch(data, () => {
  appStore.allData = data;
});

onMounted(() => {
  open();
});

onBeforeUnmount(() => {
  close();
});
</script>

<template>
  <RouterView />
</template>
