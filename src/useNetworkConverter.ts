import { computed, type Ref } from "vue";
import type { Edges, Layouts, Nodes } from "v-network-graph";

export function useNetworkConverter(network: Ref<NetworkResponse | undefined>) {
  const nodes = computed<Nodes>(() => {
    if (network.value == undefined) return undefined;

    return convertToNodes(network.value);
  });

  const edges = computed<Edges>(() => {
    if (network.value == undefined) return undefined;

    return convertToEdges(network.value);
  });

  const layouts = computed<Layouts>(() => {
    if (network.value == undefined) return undefined;
    return generateLayouts(network.value);
  });

  return { nodes, edges, layouts };
}

function convertToNodes(network: NetworkResponse): Nodes {
  const nodes: Nodes = {};

  network.containers.forEach((container) => {
    nodes[container.name] = { name: container.name };
  });

  return nodes;
}

function convertToEdges(network: NetworkResponse): Edges {
  const edges: Edges = {};
  let edgeIndex = 1;

  network.containers.forEach((container) => {
    container.to.forEach((target) => {
      const edgeKey = `edge${edgeIndex++}`;
      edges[edgeKey] = {
        source: container.name,
        target: target.name,
      };
    });
  });

  return edges;
}

function generateLayouts(network: NetworkResponse): Layouts {
  const layouts: Layouts = { nodes: {} };
  const spacingX = 160;
  const spacingY = 100;

  network.containers.forEach((container, index) => {
    const row = Math.floor(index / 3); // 3 узла в строке
    const col = index % 3;

    layouts.nodes[container.name] = {
      x: col * spacingX + Math.floor(Math.random() * 20), // небольшое смещение
      y: row * spacingY + Math.floor(Math.random() * 20),
    };
  });

  return layouts;
}
