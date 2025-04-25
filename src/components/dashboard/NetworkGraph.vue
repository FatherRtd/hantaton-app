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
        :layers="layers"
        :event-handlers="eventHandlers"
      >
        <template #edge-label="{ edge, scale, ...slotProps }">
          <v-edge-label
            :text="getLabel(edge.source, edge.target)"
            align="source"
            vertical-align="above"
            v-bind="slotProps"
            fill="#ff5500"
            :font-size="12 * scale"
          />
        </template>
      </v-network-graph>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as vNG from "v-network-graph";
import data from "@/data";

import { storeToRefs } from "pinia";
import { useAppStore } from "@/stores/useAppStore.ts";
import { useNetworkConverter } from "@/useNetworkConverter.ts";

const appStore = useAppStore();

const { selectedNetwork } = storeToRefs(useAppStore());

const { nodes, edges, layouts } = useNetworkConverter(selectedNetwork);

const layers = {
  badge: "nodes",
};

const configs = data.configs;

const getLabel = (sourceName: string, targetName: string) => {
  return "1 bytes";
};

const eventHandlers: vNG.EventHandlers = {
  "node:click": ({ node }) => {
    if (selectedNetwork.value == undefined) return;

    const index = selectedNetwork.value.containers.findIndex((x) => x.name == node);
    appStore.selectContainer(selectedNetwork.value.containers[index]);
  },
};
</script>

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
