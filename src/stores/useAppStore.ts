import { defineStore } from "pinia";
import { computed, type ComputedRef, ref } from "vue";
import type {
  IHostResponse,
  IMetricResponse,
  IRichContainerData,
} from "@/models/ContainerResponse.ts";

import type { Edges, Layouts, Nodes } from "v-network-graph";
import generateTestData from "@/data";

export const useAppStore = defineStore("appStore", () => {
  const allData = ref<IMetricResponse>(generateTestData());

  const hosts = computed(() => allData.value?.hosts);

  const getContainersByHost = (ip: string) => {
    const hostIndex = hosts.value.findIndex((x) => x.ip == ip);

    return hosts.value[hostIndex].containers;
  };

  const selectedContainer = ref<{ data: IRichContainerData; name: string }>();

  const hostsFilter = ref<IHostResponse[]>([]);

  const graphData = computed(() => {
    const graph = convertToGraph(allData.value);

    if (hostsFilter.value.length > 0) {
      return filterGraphBySelectedHosts(graph.nodes, graph.edges, hostsFilter.value);
    }

    return graph;
  });

  return { allData, hosts, getContainersByHost, graphData, selectedContainer, hostsFilter };
});

function filterGraphBySelectedHosts(
  nodes: Nodes,
  edges: Edges,
  selectedHosts: IHostResponse[],
): { nodes: Nodes; edges: Edges } {
  const selectedHostIps = new Set(selectedHosts.map((host) => host.ip));

  const filteredNodes: Nodes = {};
  Object.entries(nodes).forEach(([key, node]) => {
    const hostIp = key.split(":")[0];
    if (selectedHostIps.has(hostIp)) {
      filteredNodes[key] = node;
    }
  });

  const filteredEdges: Edges = {};
  Object.entries(edges).forEach(([edgeKey, edge]) => {
    const sourceHostIp = edge.source.split(":")[0];
    const targetHostIp = edge.target.split(":")[0];

    if (selectedHostIps.has(sourceHostIp) && selectedHostIps.has(targetHostIp)) {
      filteredEdges[edgeKey] = edge;
    }
  });

  return { nodes: filteredNodes, edges: filteredEdges };
}

function convertToGraph(metricResponse: IMetricResponse): { nodes: Nodes; edges: Edges } {
  const nodes: Nodes = {};
  const edges: Edges = {};
  let edgeCount = 0;

  for (const host of metricResponse.hosts) {
    for (const container of host.containers) {
      const publicPort = container.ports[0]?.public ?? 0;
      const nodeKey = `${host.ip}:${publicPort}`;

      nodes[nodeKey] = {
        name: container.name,
        data: { ...container, ip: host.ip },
      };
    }
  }

  for (const host of metricResponse.hosts) {
    for (const container of host.containers) {
      const sourcePublicPort = container.ports[0]?.public ?? 0;
      const sourceKey = `${host.ip}:${sourcePublicPort}`;

      for (const connection of container.to) {
        const targetHost = metricResponse.hosts.find((h) => h.ip === connection.ip);
        if (!targetHost) continue;

        const targetContainer = targetHost.containers.find((c) =>
          c.ports.some((p) => p.public === connection.port),
        );

        if (!targetContainer) continue;

        const targetPublicPort = targetContainer.ports[0]?.public ?? 0;
        const targetKey = `${connection.ip}:${targetPublicPort}`;

        console.log("test");
        if (nodes[sourceKey] && nodes[targetKey]) {
          const edgeKey = `edge_${sourceKey}_to_${targetKey}_${++edgeCount}`;
          edges[edgeKey] = {
            source: sourceKey,
            target: targetKey,
            traffic: connection.traffic,
          };
        }
      }
    }
  }

  return { nodes, edges };
}
