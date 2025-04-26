<template>
  <div class="min-w-fit">
    <div
      id="sidebar"
      ref="sidebar"
      class="flex lg:flex! flex-col absolute z-40 left-0 rounded-r-2xl top-0 lg:static lg:left-auto lg:top-auto border-r border-gray-200 dark:border-gray-700/60 lg:translate-x-0 h-[100dvh] overflow-y-scroll lg:overflow-y-auto no-scrollbar w-64 lg:w-20 lg:sidebar-expanded:!w-64 2xl:w-64! shrink-0 bg-white dark:bg-gray-800 p-4 transition-all duration-200 ease-in-out"
    >
      <div class="flex justify-between">
        <router-link class="block" to="/">
          <div v-if="sidebarExpanded" class="flex items-center justify-center">
            <div class="h-24 w-24">
              <img src="../../assets/logo-docker.png" alt="logo" />
            </div>
            <div>
              <div>Docker</div>
              <div>Monitor</div>
            </div>
          </div>
          <div v-else>
            <div class="h-12 w-12">
              <img src="../../assets/logo-docker.png" alt="logo" />
            </div>
          </div>
        </router-link>
      </div>

      <div class="space-y-8">
        <div>
          <ul class="mt-3">
            <SidebarLinkGroup v-slot="parentLink">
              <a
                class="block text-gray-800 dark:text-gray-100 truncate transition hover:text-gray-900 dark:hover:text-white"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <svg
                      class="shrink-0 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                    >
                      <path
                        d="M5.936.278A7.983 7.983 0 0 1 8 0a8 8 0 1 1-8 8c0-.722.104-1.413.278-2.064a1 1 0 1 1 1.932.516A5.99 5.99 0 0 0 2 8a6 6 0 1 0 6-6c-.53 0-1.045.076-1.548.21A1 1 0 1 1 5.936.278Z"
                      />
                      <path
                        d="M6.068 7.482A2.003 2.003 0 0 0 8 10a2 2 0 1 0-.518-3.932L3.707 2.293a1 1 0 0 0-1.414 1.414l3.775 3.775Z"
                      />
                    </svg>
                    <span
                      class="text-sm font-medium ml-4 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200"
                      >Hosts</span
                    >
                  </div>
                </div>
              </a>
              <div class="lg:hidden lg:sidebar-expanded:block 2xl:block">
                <ul class="pl-8 mt-1" :class="!parentLink.expanded && 'hidden'">
                  <li v-for="host in allHosts" :key="host.ip" class="mb-1 last:mb-0">
                    <a
                      class="block transition truncate"
                      :class="'text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
                    >
                      <span
                        class="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 cursor-pointer"
                        >{{ host.ip }} ({{ host.containers.length }})</span
                      >
                    </a>
                  </li>
                </ul>
              </div>
            </SidebarLinkGroup>
          </ul>
        </div>
      </div>

      <div class="pt-3 hidden lg:inline-flex 2xl:hidden justify-end mt-auto">
        <div class="w-12 pl-4 pr-3 py-2">
          <button
            class="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            @click.prevent="sidebarExpanded = !sidebarExpanded"
          >
            <span class="sr-only">Expand / collapse sidebar</span>
            <svg
              class="shrink-0 fill-current text-gray-400 dark:text-gray-500 sidebar-expanded:rotate-180"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
            >
              <path
                d="M15 16a1 1 0 0 1-1-1V1a1 1 0 1 1 2 0v14a1 1 0 0 1-1 1ZM8.586 7H1a1 1 0 1 0 0 2h7.586l-2.793 2.793a1 1 0 1 0 1.414 1.414l4.5-4.5A.997.997 0 0 0 12 8.01M11.924 7.617a.997.997 0 0 0-.217-.324l-4.5-4.5a1 1 0 0 0-1.414 1.414L8.586 7M12 7.99a.996.996 0 0 0-.076-.373Z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from "vue";

import SidebarLinkGroup from "./SidebarLinkGroup.vue";
import { useAppStore } from "@/stores/useAppStore.ts";

const props = defineProps<{ sidebarOpen: boolean }>();

const appStore = useAppStore();
const allHosts = computed(() => appStore.hosts);

const trigger = ref(null);
const sidebar = ref(null);

const sidebarExpanded = ref(true);

const clickHandler = ({ target }) => {
  if (!sidebar.value || !trigger.value) return;
  if (!props.sidebarOpen || sidebar.value.contains(target) || trigger.value.contains(target))
    return;
  emit("close-sidebar");
};

const keyHandler = ({ keyCode }) => {
  if (!props.sidebarOpen || keyCode !== 27) return;
  emit("close-sidebar");
};

onMounted(() => {
  document.addEventListener("click", clickHandler);
  document.addEventListener("keydown", keyHandler);
});

onUnmounted(() => {
  document.removeEventListener("click", clickHandler);
  document.removeEventListener("keydown", keyHandler);
});

watch(sidebarExpanded, () => {
  localStorage.setItem("sidebar-expanded", sidebarExpanded.value);
  if (sidebarExpanded.value) {
    document.querySelector("body").classList.add("sidebar-expanded");
  } else {
    document.querySelector("body").classList.remove("sidebar-expanded");
  }
});
</script>
