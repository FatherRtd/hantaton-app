<script setup lang="ts">
import * as vNG from "v-network-graph";

import { generateLayout, useAppStore } from "@/stores/useAppStore.ts";
import { defineConfigs } from "v-network-graph";
import { computed } from "vue";
import {
  type ForceEdgeDatum,
  ForceLayout,
  type ForceNodeDatum,
} from "v-network-graph/lib/force-layout";

const appStore = useAppStore();

// const layouts = generateLayout(appStore.graphData.nodes, appStore.graphData.edges);

const eventHandlers: vNG.EventHandlers = {
  // "node:click": ({ node }) => {
  //   if (selectedNetwork.value == undefined) return;
  //
  //   const index = selectedNetwork.value.containers.findIndex((x) => x.name == node);
  //   appStore.selectContainer(selectedNetwork.value.containers[index]);
  // },
};

const configs = computed(() =>
  defineConfigs({
    view: {
      layoutHandler: new ForceLayout({
        positionFixedByDrag: false,
        positionFixedByClickWithAltKey: true,
        createSimulation: (d3, nodes, edges) => {
          // d3-force parameters
          const forceLink = d3.forceLink<ForceNodeDatum, ForceEdgeDatum>(edges).id((d) => d.id);
          return d3
            .forceSimulation(nodes)
            .force("edge", forceLink.distance(40).strength(0.5))
            .force("charge", d3.forceManyBody().strength(-800))
            .force("center", d3.forceCenter().strength(0.05))
            .alphaMin(0.001);

          // * The following are the default parameters for the simulation.
          // const forceLink = d3.forceLink<ForceNodeDatum, ForceEdgeDatum>(edges).id(d => d.id)
          // return d3
          //   .forceSimulation(nodes)
          //   .force("edge", forceLink.distance(100))
          //   .force("charge", d3.forceManyBody())
          //   .force("collide", d3.forceCollide(50).strength(0.2))
          //   .force("center", d3.forceCenter().strength(0.05))
          //   .alphaMin(0.001)
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
            ? "#008000"
            : edge.traffic.tcp.bytes >= 2000 && edge.traffic.tcp.bytes < 4000
              ? "#FFFF00"
              : "#ff0000";
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
</script>

<template>
  <div class="bg-white dark:bg-gray-800 shadow-xs rounded-xl">
    <header class="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
      <h2 class="font-semibold text-gray-800 dark:text-gray-100">Сеть</h2>
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
