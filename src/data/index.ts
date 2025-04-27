import type {
  IContainerStats,
  IHostResponse,
  IMetricResponse,
  IRichContainerData,
} from "@/models/ContainerResponse.ts";
//
// interface GenerateTestDataOptions {
//   isolatedNodeProbability?: number; // Вероятность создания полностью изолированного узла
//   minConnections?: number; // Минимальное количество соединений для НЕизолированных узлов
//   maxConnections?: number; // Максимальное количество соединений
//   allowIntraHostConnections?: boolean; // Разрешать соединения внутри одного хоста
//   forceIsolatedNodes?: number; // Точное количество изолированных узлов (переопределяет вероятность)
// }
//
// function generateTestData(
//   hostCount: number = 3,
//   containersPerHost: number = 3,
//   options: GenerateTestDataOptions = {},
// ): IMetricResponse {
//   const {
//     isolatedNodeProbability = 0.2,
//     minConnections = 1,
//     maxConnections = 3,
//     allowIntraHostConnections = false,
//     forceIsolatedNodes = undefined,
//   } = options;
//
//   const hosts: IHostResponse[] = [];
//   const baseIp = "10.0.0.";
//   const services = [
//     { name: "web-server", ports: [80, 443], image: "nginx" },
//     { name: "database", ports: [5432], image: "postgres" },
//     { name: "cache", ports: [6379], image: "redis" },
//     { name: "api", ports: [3000, 3001], image: "node" },
//     { name: "monitoring", ports: [9090], image: "prometheus" },
//   ];
//
//   // Создаем хосты
//   for (let i = 1; i <= hostCount; i++) {
//     const hostIp = `${baseIp}${i}`;
//     const containers: IRichContainerData[] = [];
//
//     // Создаем контейнеры для каждого хоста
//     for (let j = 1; j <= containersPerHost; j++) {
//       const service = services[Math.floor(Math.random() * services.length)];
//       const publicPort = service.ports[Math.floor(Math.random() * service.ports.length)];
//       const privatePort = service.ports[0];
//
//       const stats: IContainerStats = {
//         cpuUsage: `${(Math.random() * 100).toFixed(2)}`,
//         memoryUsage: `${Math.floor(Math.random() * 4000)}MB`,
//         memoryLimit: "8192MB",
//         memoryPercentage: `${(Math.random() * 100).toFixed(2)}`,
//         hddRead: `${Math.floor(Math.random() * 100)}MB`,
//         hddWrite: `${Math.floor(Math.random() * 50)}MB`,
//         netInput: `${Math.floor(Math.random() * 500)}KB`,
//         netOutput: `${Math.floor(Math.random() * 300)}KB`,
//       };
//
//       const container: IRichContainerData = {
//         name: `${service.name}-${j}`,
//         ip: hostIp,
//         id: `container-${i}-${j}`,
//         networkName: `network-${i}`,
//         status: {
//           status: ["running", "paused", "stopped"][Math.floor(Math.random() * 3)],
//           state: ["healthy", "unhealthy", "starting"][Math.floor(Math.random() * 3)],
//         },
//         ports: [{ public: publicPort, private: privatePort }],
//         imageName: `${service.image}:latest`,
//         stats,
//         logs: "Sample log output...",
//         to: [],
//       };
//
//       containers.push(container);
//     }
//
//     hosts.push({
//       name: `host-${i}`,
//       ip: hostIp,
//       containers,
//     });
//   }
//
//   // Определяем какие узлы будут изолированными
//   const allContainers = hosts.flatMap((host) => host.containers);
//   const isolatedNodesCount =
//     forceIsolatedNodes !== undefined
//       ? Math.min(forceIsolatedNodes, allContainers.length)
//       : Math.floor(allContainers.length * isolatedNodeProbability);
//
//   const isolatedNodes = new Set<IRichContainerData>();
//   if (isolatedNodesCount > 0) {
//     // Выбираем случайные узлы для изоляции
//     while (isolatedNodes.size < isolatedNodesCount) {
//       const randomHost = hosts[Math.floor(Math.random() * hosts.length)];
//       const randomContainer =
//         randomHost.containers[Math.floor(Math.random() * randomHost.containers.length)];
//       isolatedNodes.add(randomContainer);
//     }
//   }
//
//   // Добавляем соединения между контейнерами
//   for (const host of hosts) {
//     for (const container of host.containers) {
//       // Пропускаем изолированные узлы
//       if (isolatedNodes.has(container)) continue;
//
//       // Количество соединений для этого контейнера
//       const connectionCount =
//         minConnections + Math.floor(Math.random() * (maxConnections - minConnections + 1));
//       const existingConnections = new Set<string>(); // Для избежания дубликатов
//
//       for (let i = 0; i < connectionCount; i++) {
//         let attempts = 0;
//         let targetContainer: IRichContainerData | null = null;
//         let targetHost: IHostResponse;
//
//         // Пытаемся найти подходящий целевой контейнер
//         while (attempts < 10 && !targetContainer) {
//           targetHost = hosts[Math.floor(Math.random() * hosts.length)];
//
//           // Если запрещены соединения внутри хоста, ищем на других хостах
//           if (!allowIntraHostConnections && targetHost === host) {
//             attempts++;
//             continue;
//           }
//
//           const candidate =
//             targetHost.containers[Math.floor(Math.random() * targetHost.containers.length)];
//
//           // Проверяем что это не тот же контейнер и не изолированный
//           if (candidate !== container && !isolatedNodes.has(candidate)) {
//             const connectionKey = `${candidate.ip}:${candidate.ports[0].public}`;
//             if (!existingConnections.has(connectionKey)) {
//               targetContainer = candidate;
//               existingConnections.add(connectionKey);
//             }
//           }
//
//           attempts++;
//         }
//
//         if (targetContainer) {
//           const tcpBytes = Math.floor(Math.random() * 10000);
//           const udpBytes = Math.floor(Math.random() * 5000);
//
//           container.to.push({
//             name: targetContainer.name,
//             ip: targetContainer.ip,
//             port: targetContainer.ports[0].public,
//             traffic: {
//               tcp: {
//                 bytes: tcpBytes,
//                 packets: Math.floor(tcpBytes / 1000),
//               },
//               udp: {
//                 bytes: udpBytes,
//                 packets: Math.floor(udpBytes / 1000),
//               },
//             },
//           });
//         }
//       }
//     }
//   }
//
//   return {
//     timestamp: new Date().toISOString(),
//     hosts,
//   };
// }
//
// export default generateTestData;

function generateTestData(): IMetricResponse {
  const hosts: IHostResponse[] = [
    {
      name: "host-1",
      ip: "192.168.1.1",
      containers: generateContainers("192.168.1.1", 5, 1),
    },
    {
      name: "host-2",
      ip: "192.168.1.2",
      containers: generateContainers("192.168.1.2", 5, 2),
    },
  ];

  setupConnections(hosts);
  addBidirectionalConnections(hosts);

  return {
    timestamp: new Date().toISOString(),
    hosts,
  };
}

function addConnection(source: IRichContainerData, target: IRichContainerData, targetIp: string) {
  // Генерируем трафик в трёх категориях
  const trafficCategory = Math.floor(Math.random() * 3); // 0, 1 или 2

  let tcpBytes: number;
  let udpBytes: number;

  switch (trafficCategory) {
    case 0: // Малый трафик (0-2000)
      tcpBytes = Math.floor(Math.random() * 2000);
      udpBytes = Math.floor(Math.random() * 1000);
      break;
    case 1: // Средний трафик (2000-4000)
      tcpBytes = 2000 + Math.floor(Math.random() * 2000);
      udpBytes = 1000 + Math.floor(Math.random() * 1000);
      break;
    case 2: // Большой трафик (4000+)
      tcpBytes = 4000 + Math.floor(Math.random() * 6000);
      udpBytes = 2000 + Math.floor(Math.random() * 3000);
      break;
    default:
      tcpBytes = Math.floor(Math.random() * 10000);
      udpBytes = Math.floor(Math.random() * 5000);
  }

  source.to.push({
    name: target.name,
    ip: targetIp,
    port: target.ports[0].public,
    traffic: {
      tcp: {
        bytes: tcpBytes,
        packets: Math.max(1, Math.floor(tcpBytes / 1000)),
      },
      udp: {
        bytes: udpBytes,
        packets: Math.max(1, Math.floor(udpBytes / 1000)),
      },
    },
  });
}

// Остальные функции остаются без изменений
function generateContainers(
  hostIp: string,
  count: number,
  hostNumber: number,
): IRichContainerData[] {
  const services = [
    { name: "web-server", ports: [80, 443], image: "nginx" },
    { name: "database", ports: [5432], image: "postgres" },
    { name: "cache", ports: [6379], image: "redis" },
    { name: "api", ports: [3000, 3001], image: "node" },
    { name: "monitoring", ports: [9090], image: "prometheus" },
  ];

  return Array.from({ length: count }, (_, i) => ({
    name: `${services[i % services.length].name}-${hostNumber}-${i + 1}`,
    ip: hostIp,
    id: `container-${hostNumber}-${i + 1}`,
    networkName: `network-${hostNumber}`,
    status: { status: "running", state: "healthy" },
    ports: [
      {
        public: services[i % services.length].ports[0],
        private: services[i % services.length].ports[0],
      },
    ],
    imageName: `${services[i % services.length].image}:latest`,
    stats: generateContainerStats(),
    logs: `Logs for ${services[i % services.length].name}-${hostNumber}-${i + 1}`,
    to: [],
  }));
}

function setupConnections(hosts: IHostResponse[]) {
  // Оставляем 2 контейнера без исходящих связей
  hosts[0].containers[0].to = [];
  hosts[1].containers[0].to = [];

  // Добавляем обычные связи
  addConnection(hosts[0].containers[1], hosts[0].containers[3], hosts[0].ip);
  addConnection(hosts[1].containers[1], hosts[1].containers[4], hosts[1].ip);
  addConnection(hosts[0].containers[4], hosts[1].containers[3], hosts[1].ip);
}

function addBidirectionalConnections(hosts: IHostResponse[]) {
  addConnection(hosts[0].containers[1], hosts[0].containers[2], hosts[0].ip);
  addConnection(hosts[0].containers[2], hosts[0].containers[1], hosts[0].ip);

  addConnection(hosts[1].containers[2], hosts[1].containers[3], hosts[1].ip);
  addConnection(hosts[1].containers[3], hosts[1].containers[2], hosts[1].ip);

  addConnection(hosts[0].containers[3], hosts[1].containers[2], hosts[1].ip);
  addConnection(hosts[1].containers[2], hosts[0].containers[3], hosts[0].ip);
}

function generateContainerStats(): IContainerStats {
  return {
    cpuUsage: `${(Math.random() * 100).toFixed(2)}%`,
    memoryUsage: `${Math.floor(Math.random() * 4000)}MB`,
    memoryLimit: "8192MB",
    memoryPercentage: `${(Math.random() * 100).toFixed(2)}%`,
    hddRead: `${Math.floor(Math.random() * 100)}MB`,
    hddWrite: `${Math.floor(Math.random() * 50)}MB`,
    netInput: `${Math.floor(Math.random() * 500)}KB`,
    netOutput: `${Math.floor(Math.random() * 300)}KB`,
  };
}

export default generateTestData;
