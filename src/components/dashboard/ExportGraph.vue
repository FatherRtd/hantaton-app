<script setup lang="ts">
import { computed, h, reactive, ref, toValue } from "vue";
import * as vNG from "v-network-graph";
import { Download } from "@element-plus/icons-vue";
import { useAppStore } from "@/stores/useAppStore.ts";
import { defineConfigs } from "v-network-graph";
import {
  type ForceEdgeDatum,
  ForceLayout,
  type ForceNodeDatum,
} from "v-network-graph/lib/force-layout";
import { convertToPlantUMLWithHostAndTraffic } from "@/utils/utils.ts";
import { useClipboard } from "@vueuse/core";
import { ElMessage } from "element-plus";

const appStore = useAppStore();

const nodes = reactive<vNG.Nodes>({ ...toValue(appStore.graphData.nodes) });
const edges = reactive<vNG.Edges>({ ...toValue(appStore.graphData.edges) });
const nextNodeIndex = ref(Object.keys(nodes).length + 1);
const nextEdgeIndex = ref(Object.keys(edges).length + 1);

const selectedNodes = ref<string[]>([]);
const selectedEdges = ref<string[]>([]);

// ref="graph"
const graph = ref<vNG.Instance>();

async function downloadAsSvg() {
  if (!graph.value) return;
  const text = await graph.value.exportAsSvgText();
  const url = URL.createObjectURL(new Blob([text], { type: "octet/stream" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "network-graph.svg"; // filename to download
  a.click();
  window.URL.revokeObjectURL(url);
}

function addNode() {
  const nodeId = `node${nextNodeIndex.value}`;
  const name = `N${nextNodeIndex.value}`;
  nodes[nodeId] = { name };
  nextNodeIndex.value++;
}

function removeNode() {
  for (const nodeId of selectedNodes.value) {
    delete nodes[nodeId];
  }
}

function addEdge() {
  if (selectedNodes.value.length !== 2) return;
  const [source, target] = selectedNodes.value;
  const edgeId = `edge${nextEdgeIndex.value++}`;
  edges[edgeId] = { source, target };
}

function removeEdge() {
  for (const edgeId of selectedEdges.value) {
    delete edges[edgeId];
  }
}

const configs = computed(() =>
  defineConfigs({
    view: {
      layoutHandler: new ForceLayout({
        positionFixedByDrag: false,
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
            : "#000000";
        },
      },

      label: {
        visible: true,
        fontFamily: undefined,
        fontSize: 11,
        lineHeight: 1.1,
        color: "#000000",
        margin: 4,
        direction: "south",
        text: "name",
      },
    },
    edge: {
      selectable: true,
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
const source = ref("Hello");
const { text, copy, copied, isSupported } = useClipboard({ source });
const copyUml = () => {
  const umlstr = convertToPlantUMLWithHostAndTraffic(nodes, edges);
  copy(umlstr);

  ElMessage({
    message: h("p", { style: "line-height: 1; font-size: 14px" }, [h("span", null, "Copied! ")]),
  });
};
</script>

<template>
  <div class="bg-white shadow-xs rounded-xl">
    <div class="flex items-center justify-between mb-2">
      <button
        class="flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
        @click="downloadAsSvg"
      >
        Download
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

      <button
        class="flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
        @click="copyUml"
      >
        Copy UML
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>

      <label>Node:</label>
      <button
        class="flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
        @click="addNode"
      >
        Add
      </button>
      <button
        class="flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
        @click="removeNode"
      >
        Remove
      </button>

      <label>Edge:</label>
      <button
        class="flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
        @click="addEdge"
      >
        Add
      </button>
      <button
        class="flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
        @click="removeEdge"
      >
        Remove
      </button>
    </div>

    <v-network-graph
      ref="graph"
      class="graph"
      v-model:selected-nodes="selectedNodes"
      v-model:selected-edges="selectedEdges"
      :nodes="nodes"
      :edges="edges"
      :configs="configs"
    />
  </div>
</template>

<style scoped>
.graph {
  width: 100%;
  height: 500px;
  border: 1px solid #000;
}
</style>
