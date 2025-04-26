<script setup lang="ts">
import { useAppStore } from "@/stores/useAppStore.ts";
import { computed } from "vue";
import SidebarLinkGroup from "@/components/layout/SidebarLinkGroup.vue";

const appStore = useAppStore();
const selectedContainer = computed(() => appStore.selectedContainer.data);
const tcpData = computed(() => {
  if (selectedContainer.value.to.length == 0) {
    return { packages: 0, bytes: 0 };
  }

  const packages = selectedContainer.value.to
    .map((x) => x.traffic.tcp.packets)
    .reduce((acc, x) => acc + x);
  const bytes = selectedContainer.value.to
    .map((x) => x.traffic.tcp.bytes)
    .reduce((acc, x) => acc + x);
  return { packages, bytes };
});

const udpData = computed(() => {
  if (selectedContainer.value.to.length == 0) {
    return { packages: 0, bytes: 0 };
  }
  const packages = selectedContainer.value.to
    .map((x) => x.traffic.udp.packets)
    .reduce((acc, x) => acc + x);
  const bytes = selectedContainer.value.to
    .map((x) => x.traffic.udp.bytes)
    .reduce((acc, x) => acc + x);
  return { packages, bytes };
});
</script>

<template>
  <SidebarLinkGroup v-slot="parentLink" class="w-full">
    <a
      class="block text-gray-800 dark:text-gray-100 truncate transition hover:text-gray-900 dark:hover:text-white"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <img width="24px" height="24px" src="../../assets/docker.png" alt="" />
          <span
            class="text-sm font-medium ml-4 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200"
            >{{ selectedContainer.name }}</span
          >
        </div>
      </div>
    </a>
    <div class="lg:hidden lg:sidebar-expanded:block 2xl:block">
      <ul class="pl-8 mt-1" :class="!parentLink.expanded && 'hidden'">
        <div>
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="mr-2"><img src="../../assets/servers.png" alt="" /></div>
              <div>Host</div>
            </div>
            <div>{{ selectedContainer.ip }}</div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="mr-2"><img src="../../assets/ethernet.png" alt="" /></div>
              <div>TCP</div>
            </div>
            <div>{{ tcpData.bytes }} bytes</div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="mr-2"><img src="../../assets/ethernet.png" alt="" /></div>
              <div>UDP</div>
            </div>
            <div>{{ udpData.bytes }} bytes</div>
          </div>
        </div>
      </ul>
    </div>
  </SidebarLinkGroup>
</template>

<style scoped></style>
