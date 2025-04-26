import { defineStore } from "pinia";
import { computed, type ComputedRef, ref } from "vue";
import type { IHostResponse, IMetricResponse } from "@/models/ContainerResponse.ts";

import type { Edges, Layouts, Nodes } from "v-network-graph";
import generateTestData from "@/data";

export const useAppStore = defineStore("appStore", () => {
  const allData = ref<IMetricResponse>(generateTestData(6, 4));

  const hosts = computed(() => allData.value?.hosts);

  const hostAddresses = computed(() => hosts.value.map((x) => x.ip));

  const getContainersByHost = (ip: string) => {
    const hostIndex = hosts.value.findIndex((x) => x.ip == ip);

    return hosts.value[hostIndex].containers;
  };

  const graphData = computed(() => convertToGraph(allData.value));

  return { allData, hosts, getContainersByHost, graphData };
});

function convertToGraph(metricResponse: IMetricResponse): { nodes: Nodes; edges: Edges } {
  const nodes: Nodes = {};
  const edges: Edges = {};
  let edgeCount = 0;
  // Сначала собираем все узлы (контейнеры)
  for (const host of metricResponse.hosts) {
    for (const container of host.containers) {
      // Используем первый публичный порт, если есть, иначе 0
      const publicPort = container.ports[0]?.public ?? 0;
      const nodeKey = `${host.ip}:${publicPort}`;

      nodes[nodeKey] = {
        name: container.name,
        data: { ...container, ip: host.ip }, // Сохраняем все данные контейнера
      };
    }
  }

  // Затем собираем все связи между контейнерами
  for (const host of metricResponse.hosts) {
    for (const container of host.containers) {
      const sourcePublicPort = container.ports[0]?.public ?? 0;
      const sourceKey = `${host.ip}:${sourcePublicPort}`;

      for (const connection of container.to) {
        // Ищем контейнер-цель по IP и порту
        const targetHost = metricResponse.hosts.find((h) => h.ip === connection.ip);
        if (!targetHost) continue;

        const targetContainer = targetHost.containers.find((c) =>
          c.ports.some((p) => p.public === connection.port),
        );

        if (!targetContainer) continue;

        const targetPublicPort = targetContainer.ports[0]?.public ?? 0;
        const targetKey = `${connection.ip}:${targetPublicPort}`;

        // Создаем связь только если оба узла существуют
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

// export function generateLayout(
//   nodes: Nodes,
//   edges: Edges,
//   options = { stepX: 100, stepY: 100 },
// ): Layouts {
//   const layout: Layouts = { nodes: {} };
//   const nodeKeys = Object.keys(nodes);
//
//   // Простой алгоритм размещения - зигзаг
//   nodeKeys.forEach((key, index) => {
//     const row = Math.floor(index / 2);
//     const isEven = index % 2 === 0;
//
//     layout.nodes[key] = {
//       x: row * options.stepX,
//       y: isEven ? 0 : options.stepY,
//     };
//   });
//
//   return layout;
// }

export function generateLayout(
  nodes: Nodes,
  edges: Edges,
  options = {
    width: 1000,
    height: 800,
    margin: 50,
    levelSpacing: 200,
    nodeSpacing: 150,
    randomness: 0.4,
  },
): Layouts {
  const layout: Layouts = { nodes: {} };
  const nodeKeys = Object.keys(nodes);

  if (nodeKeys.length === 0) return layout;

  // 1. Определяем уровни для каждого узла (BFS)
  const { levels, maxLevel } = calculateNodeLevels(nodeKeys, edges);

  // 2. Группируем узлы по уровням
  const nodesByLevel: Record<number, string[]> = {};
  nodeKeys.forEach((key) => {
    const level = levels[key] || 0;
    if (!nodesByLevel[level]) nodesByLevel[level] = [];
    nodesByLevel[level].push(key);
  });

  // 3. Распределяем узлы по уровням с добавлением случайности
  const levelWidth = options.width - 2 * options.margin;
  const levelStep = maxLevel > 1 ? levelWidth / (maxLevel - 1) : 0;

  Object.entries(nodesByLevel).forEach(([levelStr, levelNodes]) => {
    const level = parseInt(levelStr);
    const baseX = options.margin + level * levelStep;

    // Высота для текущего уровня
    const levelHeight = options.height - 2 * options.margin;
    const nodeStep = levelHeight / (levelNodes.length + 1);

    levelNodes.forEach((key, index) => {
      // Базовые координаты
      const baseY = options.margin + (index + 1) * nodeStep;

      // Добавляем случайность
      const randomX = (Math.random() - 0.5) * options.levelSpacing * options.randomness;
      const randomY = (Math.random() - 0.5) * options.nodeSpacing * options.randomness;

      layout.nodes[key] = {
        x: baseX + randomX,
        y: baseY + randomY,
      };
    });
  });

  // 4. Оптимизация для уменьшения пересечений связей
  optimizeLayout(layout, edges, {
    iterations: 50,
    repulsion: 100,
    attraction: 0.1,
    maxMovement: 10,
  });

  return layout;
}

// Вспомогательные функции

function calculateNodeLevels(
  nodeKeys: string[],
  edges: Edges,
): { levels: Record<string, number>; maxLevel: number } {
  const levels: Record<string, number> = {};
  let maxLevel = 0;

  // Находим исходные узлы (без входящих связей)
  const sources = findSourceNodes(nodeKeys, edges);
  const queue: { key: string; level: number }[] = sources.map((key) => ({ key, level: 0 }));
  const visited = new Set<string>(sources);

  // BFS для определения уровней
  while (queue.length > 0) {
    const current = queue.shift()!;
    levels[current.key] = current.level;
    maxLevel = Math.max(maxLevel, current.level);

    const outgoingEdges = findOutgoingEdges(current.key, edges);
    for (const edge of outgoingEdges) {
      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        queue.push({ key: edge.target, level: current.level + 1 });
      }
    }
  }

  // Узлы без связей получают случайный уровень
  nodeKeys.forEach((key) => {
    if (levels[key] === undefined) {
      levels[key] = Math.floor(Math.random() * 3);
      maxLevel = Math.max(maxLevel, levels[key]);
    }
  });

  return { levels, maxLevel };
}

function optimizeLayout(
  layout: Layouts,
  edges: Edges,
  options: {
    iterations: number;
    repulsion: number;
    attraction: number;
    maxMovement: number;
  },
) {
  const nodeKeys = Object.keys(layout.nodes);
  const edgeList = Object.values(edges);

  for (let i = 0; i < options.iterations; i++) {
    const forces: Record<string, { dx: number; dy: number }> = {};
    nodeKeys.forEach((key) => {
      forces[key] = { dx: 0, dy: 0 };
    });

    // Отталкивание между всеми узлами
    for (let j = 0; j < nodeKeys.length; j++) {
      for (let k = j + 1; k < nodeKeys.length; k++) {
        const key1 = nodeKeys[j];
        const key2 = nodeKeys[k];
        const node1 = layout.nodes[key1];
        const node2 = layout.nodes[key2];

        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.1;

        if (distance < 150) {
          const force = options.repulsion / (distance * distance);
          const fx = (force * dx) / distance;
          const fy = (force * dy) / distance;

          forces[key1].dx -= fx;
          forces[key1].dy -= fy;
          forces[key2].dx += fx;
          forces[key2].dy += fy;
        }
      }
    }

    // Притяжение между связанными узлами
    edgeList.forEach((edge) => {
      const source = layout.nodes[edge.source];
      const target = layout.nodes[edge.target];

      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.1;

        const force = options.attraction * distance;
        const fx = (force * dx) / distance;
        const fy = (force * dy) / distance;

        forces[edge.source].dx += fx;
        forces[edge.source].dy += fy;
        forces[edge.target].dx -= fx;
        forces[edge.target].dy -= fy;
      }
    });

    // Применяем силы с ограничением максимального перемещения
    nodeKeys.forEach((key) => {
      const force = forces[key];
      const movement = Math.sqrt(force.dx * force.dx + force.dy * force.dy);

      if (movement > options.maxMovement) {
        force.dx = (force.dx * options.maxMovement) / movement;
        force.dy = (force.dy * options.maxMovement) / movement;
      }

      layout.nodes[key].x += force.dx;
      layout.nodes[key].y += force.dy;
    });
  }
}
function findSourceNodes(nodes: Nodes, edges: Edges): string[] {
  const nodeKeys = new Set(Object.keys(nodes));
  const targets = new Set<string>();

  Object.values(edges).forEach((edge) => {
    targets.add(edge.target);
  });

  return Array.from(nodeKeys).filter((key) => !targets.has(key));
}

function findOutgoingEdges(
  source: string,
  edges: Edges,
): Array<{ source: string; target: string }> {
  return Object.values(edges).filter((edge) => edge.source === source);
}
