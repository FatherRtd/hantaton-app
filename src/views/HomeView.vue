<script setup lang="ts">
import { reactive, ref } from "vue";
import * as vNG from "v-network-graph";
import data from "@/data";

const layers = {
  badge: "nodes",
};

const nodes = reactive({ ...data.nodes });

const layouts = ref({ ...data.layouts });

const edges = data.edges;
const configs = data.configs;

const eventHandlers: vNG.EventHandlers = {
  "node:click": ({ node }) => {
    nodes[node].active = !nodes[node].active;
  },
};
</script>

<template>
  <v-network-graph
    class="graph"
    :nodes="nodes"
    :edges="edges"
    :layouts="layouts"
    :configs="configs"
    :layers="layers"
    :event-handlers="eventHandlers"
  >
    <!-- Additional layer -->
    <template #badge="{ scale }">
      <!--
        If the `view.scalingObjects` config is `false`(default),
        scaling does not change the display size of the nodes/edges.
        The `scale` is passed as a scaling factor to implement
        this behavior. -->
      <circle
        v-for="(pos, node) in layouts.nodes"
        :key="node"
        :cx="pos.x + 9 * scale"
        :cy="pos.y - 9 * scale"
        :r="4 * scale"
        :fill="nodes[node].active ? '#00cc00' : '#ff5555'"
        style="pointer-events: none"
      />
    </template>
  </v-network-graph>
</template>

<style scoped>
.graph {
  width: 800px;
  height: 600px;
  border: 1px solid #000;
}
</style>
