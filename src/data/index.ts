import type {
  IContainerStats,
  IHostResponse,
  IMetricResponse,
  IRichContainerData,
} from "@/models/ContainerResponse.ts";

interface GenerateTestDataOptions {
  isolatedNodeProbability?: number; // Вероятность создания полностью изолированного узла
  minConnections?: number; // Минимальное количество соединений для НЕизолированных узлов
  maxConnections?: number; // Максимальное количество соединений
  allowIntraHostConnections?: boolean; // Разрешать соединения внутри одного хоста
  forceIsolatedNodes?: number; // Точное количество изолированных узлов (переопределяет вероятность)
}

function generateTestData(
  hostCount: number = 3,
  containersPerHost: number = 3,
  options: GenerateTestDataOptions = {},
): IMetricResponse {
  const {
    isolatedNodeProbability = 0.2,
    minConnections = 1,
    maxConnections = 3,
    allowIntraHostConnections = false,
    forceIsolatedNodes = undefined,
  } = options;

  const hosts: IHostResponse[] = [];
  const baseIp = "10.0.0.";
  const services = [
    { name: "web-server", ports: [80, 443], image: "nginx" },
    { name: "database", ports: [5432], image: "postgres" },
    { name: "cache", ports: [6379], image: "redis" },
    { name: "api", ports: [3000, 3001], image: "node" },
    { name: "monitoring", ports: [9090], image: "prometheus" },
  ];

  // Создаем хосты
  for (let i = 1; i <= hostCount; i++) {
    const hostIp = `${baseIp}${i}`;
    const containers: IRichContainerData[] = [];

    // Создаем контейнеры для каждого хоста
    for (let j = 1; j <= containersPerHost; j++) {
      const service = services[Math.floor(Math.random() * services.length)];
      const publicPort = service.ports[Math.floor(Math.random() * service.ports.length)];
      const privatePort = service.ports[0];

      const stats: IContainerStats = {
        cpuUsage: `${(Math.random() * 100).toFixed(2)}`,
        memoryUsage: `${Math.floor(Math.random() * 4000)}MB`,
        memoryLimit: "8192MB",
        memoryPercentage: `${(Math.random() * 100).toFixed(2)}`,
        hddRead: `${Math.floor(Math.random() * 100)}MB`,
        hddWrite: `${Math.floor(Math.random() * 50)}MB`,
        netInput: `${Math.floor(Math.random() * 500)}KB`,
        netOutput: `${Math.floor(Math.random() * 300)}KB`,
      };

      const container: IRichContainerData = {
        name: `${service.name}-${j}`,
        ip: hostIp,
        id: `container-${i}-${j}`,
        networkName: `network-${i}`,
        status: {
          status: ["running", "paused", "stopped"][Math.floor(Math.random() * 3)],
          state: ["healthy", "unhealthy", "starting"][Math.floor(Math.random() * 3)],
        },
        ports: [{ public: publicPort, private: privatePort }],
        imageName: `${service.image}:latest`,
        stats,
        logs: "Sample log output...",
        to: [],
      };

      containers.push(container);
    }

    hosts.push({
      name: `host-${i}`,
      ip: hostIp,
      containers,
    });
  }

  // Определяем какие узлы будут изолированными
  const allContainers = hosts.flatMap((host) => host.containers);
  const isolatedNodesCount =
    forceIsolatedNodes !== undefined
      ? Math.min(forceIsolatedNodes, allContainers.length)
      : Math.floor(allContainers.length * isolatedNodeProbability);

  const isolatedNodes = new Set<IRichContainerData>();
  if (isolatedNodesCount > 0) {
    // Выбираем случайные узлы для изоляции
    while (isolatedNodes.size < isolatedNodesCount) {
      const randomHost = hosts[Math.floor(Math.random() * hosts.length)];
      const randomContainer =
        randomHost.containers[Math.floor(Math.random() * randomHost.containers.length)];
      isolatedNodes.add(randomContainer);
    }
  }

  // Добавляем соединения между контейнерами
  for (const host of hosts) {
    for (const container of host.containers) {
      // Пропускаем изолированные узлы
      if (isolatedNodes.has(container)) continue;

      // Количество соединений для этого контейнера
      const connectionCount =
        minConnections + Math.floor(Math.random() * (maxConnections - minConnections + 1));
      const existingConnections = new Set<string>(); // Для избежания дубликатов

      for (let i = 0; i < connectionCount; i++) {
        let attempts = 0;
        let targetContainer: IRichContainerData | null = null;
        let targetHost: IHostResponse;

        // Пытаемся найти подходящий целевой контейнер
        while (attempts < 10 && !targetContainer) {
          targetHost = hosts[Math.floor(Math.random() * hosts.length)];

          // Если запрещены соединения внутри хоста, ищем на других хостах
          if (!allowIntraHostConnections && targetHost === host) {
            attempts++;
            continue;
          }

          const candidate =
            targetHost.containers[Math.floor(Math.random() * targetHost.containers.length)];

          // Проверяем что это не тот же контейнер и не изолированный
          if (candidate !== container && !isolatedNodes.has(candidate)) {
            const connectionKey = `${candidate.ip}:${candidate.ports[0].public}`;
            if (!existingConnections.has(connectionKey)) {
              targetContainer = candidate;
              existingConnections.add(connectionKey);
            }
          }

          attempts++;
        }

        if (targetContainer) {
          const tcpBytes = Math.floor(Math.random() * 10000);
          const udpBytes = Math.floor(Math.random() * 5000);

          container.to.push({
            name: targetContainer.name,
            ip: targetContainer.ip,
            port: targetContainer.ports[0].public,
            traffic: {
              tcp: {
                bytes: tcpBytes,
                packets: Math.floor(tcpBytes / 1000),
              },
              udp: {
                bytes: udpBytes,
                packets: Math.floor(udpBytes / 1000),
              },
            },
          });
        }
      }
    }
  }

  return {
    timestamp: new Date().toISOString(),
    hosts,
  };
}

export default generateTestData;
