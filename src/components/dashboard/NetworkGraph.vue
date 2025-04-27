<script setup lang="ts">
import * as vNG from "v-network-graph";

import { useAppStore } from "@/stores/useAppStore.ts";
import { defineConfigs, type Edges, type Nodes } from "v-network-graph";
import { computed, ref } from "vue";
import {
  type ForceEdgeDatum,
  ForceLayout,
  type ForceNodeDatum,
} from "v-network-graph/lib/force-layout";
import ExportGraph from "@/components/dashboard/ExportGraph.vue";

const appStore = useAppStore();

const eventHandlers: vNG.EventHandlers = {
  "node:click": ({ node }) => {
    appStore.selectedContainer = appStore.graphData.nodes[node];
  },
};

const configs = computed(() =>
  defineConfigs({
    view: {
      layoutHandler: new ForceLayout({
        positionFixedByDrag: true,
        positionFixedByClickWithAltKey: true,
        createSimulation: (d3, nodes, edges) => {
          const forceLink = d3.forceLink<ForceNodeDatum, ForceEdgeDatum>(edges).id((d) => d.id);
          return d3
            .forceSimulation(nodes)
            .force("edge", forceLink.distance(40).strength(0.5))
            .force("charge", d3.forceManyBody().strength(-800))
            .force("center", d3.forceCenter().strength(0.05))
            .alphaMin(0.001);
        },
      }),
    },
    node: {
      selectable: true,
      normal: {
        type: "circle",
        color: (node) => {
          const targetIp = node.data.ip;
          const targetPort = node.data.ports[0]?.public ?? 0;
          const targetKey = `${targetIp}:${targetPort}`;

          return node.data.to.length == 0 &&
            Object.values(appStore.graphData.nodes).every((node) => {
              return !node.data.to.some((conn) => {
                const connKey = `${conn.ip}:${conn.port}`;
                return connKey === targetKey;
              });
            })
            ? "#808080"
            : "#FFFFFF";
        },
      },

      label: {
        visible: true,
        fontFamily: undefined,
        fontSize: 11,
        lineHeight: 1.1,
        color: "#FFFFFF",
        margin: 4,
        direction: "south",
        text: "name",
      },
    },
    edge: {
      normal: {
        width: 2,
        color: (edge) => {
          return edge.traffic.tcp.bytes < 2000
            ? "#48C774"
            : edge.traffic.tcp.bytes >= 2000 && edge.traffic.tcp.bytes < 4000
              ? "#F9C74F"
              : "#ff0000"; //#E74C3C
        },
      },
      marker: {
        target: {
          type: "arrow",
        },
      },
    },
  }),
);

const dialogTableVisible = ref(false);
</script>

<template>
  <div class="bg-white dark:bg-gray-800 shadow-xs rounded-xl">
    <header
      class="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between"
    >
      <h2 class="font-semibold text-gray-800 dark:text-gray-100">Сеть</h2>
      <button
        class="flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
        @click="dialogTableVisible = true"
      >
        Export
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </header>

    <div class="p-3" v-if="appStore.graphData.nodes">
      <v-network-graph
        class="graph"
        :zoom-level="0.5"
        :nodes="appStore.graphData.nodes"
        :edges="appStore.graphData.edges"
        :configs="configs"
        :event-handlers="eventHandlers"
      >
      </v-network-graph>
    </div>
  </div>

  <el-dialog v-model="dialogTableVisible" title="Export" width="800">
    <ExportGraph />
  </el-dialog>
</template>

<style scoped>
.graph {
  width: 100%;
  height: 500px;
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
