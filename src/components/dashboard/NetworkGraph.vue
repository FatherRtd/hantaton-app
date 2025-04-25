<script setup lang="ts">
import * as vNG from "v-network-graph";
import data from "@/data";

import { storeToRefs } from "pinia";
import { useAppStore } from "@/stores/useAppStore.ts";
import { useNetworkConverter } from "@/useNetworkConverter.ts";
import { ref } from "vue";

const appStore = useAppStore();

const { selectedNetwork } = storeToRefs(useAppStore());

const { nodes, edges, layouts } = useNetworkConverter(selectedNetwork);

const configs = data.configs;

function showContextMenu(element: HTMLElement, event: MouseEvent) {
  element.style.left = event.x + "px";
  element.style.top = event.y + "px";
  element.style.visibility = "visible";
  const handler = (event: PointerEvent) => {
    if (!event.target || !element.contains(event.target as HTMLElement)) {
      element.style.visibility = "hidden";
      document.removeEventListener("pointerdown", handler, { capture: true });
    }
  };
  document.addEventListener("pointerdown", handler, { passive: true, capture: true });
}

const edgeMenu = ref<HTMLDivElement>();
const edgeTraffic = ref<{
  tcp: { bytes: number; packets: number };
  udp: { bytes: number; packets: number };
}>([]);
function showEdgeContextMenu(params: vNG.EdgeEvent<MouseEvent>) {
  const { event } = params;
  // Disable browser's default context menu
  event.stopPropagation();
  event.preventDefault();
  if (edgeMenu.value) {
    edgeTraffic.value = {
      tcp: { bytes: 1000000, packets: 1000 },
      udp: { bytes: 50000, packets: 100 },
    };

    showContextMenu(edgeMenu.value, event);
  }
}

const eventHandlers: vNG.EventHandlers = {
  "node:click": ({ node }) => {
    if (selectedNetwork.value == undefined) return;

    const index = selectedNetwork.value.containers.findIndex((x) => x.name == node);
    appStore.selectContainer(selectedNetwork.value.containers[index]);
  },
  "edge:contextmenu": showEdgeContextMenu,
};
</script>

<template>
  <div class="bg-white dark:bg-gray-800 shadow-xs rounded-xl">
    <header class="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
      <h2 class="font-semibold text-gray-800 dark:text-gray-100">
        Сеть: {{ selectedNetwork?.name }}
      </h2>
    </header>

    <div class="p-3" v-if="nodes && edges">
      <v-network-graph
        class="graph"
        :nodes="nodes"
        :edges="edges"
        :layouts="layouts"
        :configs="configs"
        :event-handlers="eventHandlers"
      >
        <div ref="edgeMenu" class="context-menu">Menu for the edges</div>
      </v-network-graph>
    </div>
  </div>
</template>

<style scoped>
.graph {
  width: 100%;
  height: 400px;
  border: 1px solid #000;
}

.context-menu {
  width: 180px;
  background-color: #efefef;
  padding: 10px;
  position: fixed;
  visibility: hidden;
  font-size: 12px;
  border: 1px solid #aaa;
  box-shadow: 2px 2px 2px #aaa;
  > div {
    border: 1px dashed #aaa;
    padding: 4px;
    margin-top: 8px;
  }
}
</style>
