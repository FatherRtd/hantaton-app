<template>
  <div class="flex h-screen overflow-hidden">
    <AppSidebar
      :metrics="metrics"
      :sidebarOpen="sidebarOpen"
      @close-sidebar="sidebarOpen = false"
    />

    <div class="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
      <AppHeader />

      <main class="grow">
        <div class="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto h-full">
          <div class="mb-4">
            <NetworkGraph />
          </div>

          <!--          <div class="grid grid-cols-3 gap-4 w-full">-->
          <!--            <AppCard label="Состояние контейнера">-->
          <!--              <ContainerState />-->
          <!--            </AppCard>-->
          <!--            <AppCard label="Информация о контейнере">-->
          <!--              <ContainerInfo />-->
          <!--            </AppCard>-->
          <!--            <AppCard label="Логи"> </AppCard>-->
          <!--          </div>-->
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import AppSidebar from "../components/layout/AppSidebar.vue";
import AppHeader from "../components/layout/AppHeader.vue";
import NetworkGraph from "@/components/dashboard/NetworkGraph.vue";
import AppCard from "@/components/dashboard/AppCard.vue";
import data from "@/data";
import type { IMetricResponse } from "@/models/ContainerResponse.ts";
import ContainerInfo from "@/components/dashboard/ContainerInfo.vue";
import ContainerState from "@/components/dashboard/ContainerState.vue";
import { storeToRefs } from "pinia";
import { useAppStore } from "@/stores/useAppStore.ts";

const sidebarOpen = ref(false);

const mockMetrics = ref<IMetricResponse>(data.mockMetricResponse);
const metrics = computed(() => mockMetrics.value);
</script>
