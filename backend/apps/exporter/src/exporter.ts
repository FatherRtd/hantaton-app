import Dockerode, {Container} from 'dockerode';
import { exec } from 'child_process';
import { promisify } from 'util';

// Контейнер доступен по localhost: порт основного приложения

const execAsync = promisify(exec);
const inspectAsync = promisify((network: any, cb: any) => network.inspect(cb));

type NetworksTopology = {
    name: string;
    driver: string;
    containers: ContainerTopology[];
}

type ContainerTopology = {
    name: string;
    ip: string;
};

type TrafficStats = {
    bytes: number;
    packets: number;
    srcPort?: number,
    dstPort?: number
};

type RawMetric = {
    from: ContainerTopology;
    to: ContainerTopology;
    tcp: TrafficStats;
    udp: TrafficStats;
};

type TrafficWithPorts = {
    tcp: {
        bytes: number,
        packets: number,
        srcPort?: number,
        dstPort?: number
    },
    udp: {
        bytes: number,
        packets: number,
        srcPort?: number,
        dstPort?: number
    }
};

type UnionRawMetric = {
    name: string;
    ip: string;
    to: {
        name: string;
        ip: string;
        traffic: TrafficWithPorts
    }[];
};

type UnionRawMetricWithId = UnionRawMetric & { id: string };

type ContainerStats = {
    cpuUsage: string;
    memoryUsage: string;
    memoryLimit: string;
    memoryPercentage: string;
    hddRead: string;
    hddWrite: string;
    netInput: string;
    netOutput: string;
}

type RichContainerData = {
    name: string;
    ip: string;
    id: string;
    status: {
        status: string;
        state: string;
    };
    ports: {
        public: number,
        private: number
    }[];
    imageName: string;
    stats?: ContainerStats;
    logs: string;
    to: {
        name: string;
        ip: string;
        traffic: {
            tcp: {
                bytes: number,
                packets: number,
                srcPort?: number,
                dstPort?: number
            },
            udp: {
                bytes: number,
                packets: number,
                srcPort?: number,
                dstPort?: number
            }
        }
    }[];
}

type NetworkResponse = {
    name: string;
    driver: string;
    containers: RichContainerData[];
}

type Response = {
    timestamp: string;
    networks: NetworkResponse[];
}

type NetworkInspectInfo = Dockerode.NetworkInspectInfo;
type ContainerInfo = Dockerode.ContainerInfo;

let hostsThis: { name: string; ip: string; }[] = [];

const docker = new Dockerode();

export async function setup() {
    // Вешаем правила сбора трафика по ip конетейнера
    setInterval(async () => {
        const networksTopologies = await getNetworksTopologies();

        if (networksTopologies.length === 0) {
            console.error('No containers found.');
            return;
        }

        await setupIptables(networksTopologies);
        console.log(networksTopologies);
    }, 10000)

}

async function getDockerNetworks(): Promise<NetworkInspectInfo[] | undefined> {
    return new Promise((resolve, reject) => {
        docker.listNetworks({}, (err, networks) => {
            if (err) return reject(err);
            resolve(networks);
        });
    });
}

async function getDockerContainers(): Promise<ContainerInfo[] | undefined> {
    return new Promise((resolve, reject) => {
        docker.listContainers({ all: true }, (err, networks) => {
            if (err) return reject(err);
            resolve(networks);
        });
    });
}

async function getConntrackData(): Promise<string[]> {
    try {
        const { stdout } = await execAsync('conntrack -L -n 2>/dev/null || echo ""');
        return stdout.split('\n');
    } catch (error) {
        console.error('Error getting conntrack data:', error);
        return [];
    }
}

function extractPortsFromConntrack(conntrackLines: string[], srcIP: string, dstIP: string): { srcPort?: number, dstPort?: number } {
    for (const line of conntrackLines) {
        if (line.includes(`src=${srcIP}`) && line.includes(`dst=${dstIP}`)) {
            const srcPortMatch = line.match(/sport=(\d+)/);
            const dstPortMatch = line.match(/dport=(\d+)/);
            return {
                srcPort: srcPortMatch ? parseInt(srcPortMatch[1]) : undefined,
                dstPort: dstPortMatch ? parseInt(dstPortMatch[1]) : undefined
            };
        }
    }
    return {};
}

async function getNetworksTopologies(): Promise<NetworksTopology[]> {
    try {
        const networksRaw = await getDockerNetworks();

        if(!networksRaw || networksRaw.length === 0) {
            return [];
        }

        const networks = networksRaw.map(network => docker.getNetwork(network.Id));
        const networksInfo = await Promise.all(networks.map(async x => await inspectAsync(x))) as NetworkInspectInfo[];

        if(!networksInfo) {
            return [];
        }
        return networksInfo.map(networkInfo => {
            const containers = networkInfo.Containers ? Object.values(networkInfo.Containers).map(container => ({
                name: container.Name,
                ip: container.IPv4Address.split('/')[0],
            })) : [];

            for(const host of hostsThis) {
                containers.push({
                    name: host.name,
                    ip: host.ip,
                })
            }

            return {
                name: networkInfo.Name,
                driver: networkInfo.Driver,
                containers
            }
        })
    } catch (error) {
        console.error('Error fetching container IPs:', error);
        return [];
    }
}

async function setupIptables(networksTopologies: NetworksTopology[]) {
    for (const networksTopology of networksTopologies) {
        if(networksTopology.containers.length === 0) {
            continue;
        }

        try {
            for (const source of networksTopology.containers) {
                for (const target of networksTopology.containers) {
                    if (source.ip !== target.ip && source.ip !== '' && target.ip !== '') {
                        const cmdFirst = `iptables -C FORWARD -p udp -s ${source.ip} -d ${target.ip} || 
                                     iptables -A FORWARD -p udp -s ${source.ip} -d ${target.ip}`;
                        await execAsync(cmdFirst);

                        const cmdSecond = `iptables -C FORWARD -p tcp -s ${source.ip} -d ${target.ip} || 
                                        iptables -A FORWARD -p tcp -s ${source.ip} -d ${target.ip}`;
                        await execAsync(cmdSecond);
                    }
                }
            }
        } catch (error) {
            console.error('Error setting up iptables rules:', error);
        }
    }
}

async function getTrafficStatsWithPorts(containerIPs: ContainerTopology[], iptablesLines: string[]): Promise<RawMetric[]> {
    try {
        const conntrackLines = await getConntrackData();
        const trafficMap: Record<string, RawMetric> = {};

        for (const line of iptablesLines) {
            const fields = line.trim().split(/\s+/);
            if (fields.length >= 8) {
                const packets = parseInt(fields[0], 10);
                const bytes = parseInt(fields[1], 10);
                const protocol = fields[2].toLowerCase();
                const srcIP = fields[6];
                const dstIP = fields[7];

                const sourceContainer = containerIPs.find(c => c.ip === srcIP);
                const targetContainer = containerIPs.find(c => c.ip === dstIP);

                if (sourceContainer && targetContainer) {
                    const key = `${sourceContainer.ip}-${targetContainer.ip}`;
                    const ports = extractPortsFromConntrack(conntrackLines, srcIP, dstIP);

                    if (!trafficMap[key]) {
                        trafficMap[key] = {
                            from: {
                                ip: sourceContainer.ip,
                                name: sourceContainer.name
                            },
                            to: {
                                ip: targetContainer.ip,
                                name: targetContainer.name
                            },
                            tcp: {
                                bytes: 0,
                                packets: 0,
                                srcPort: undefined,
                                dstPort: undefined
                            },
                            udp: {
                                bytes: 0,
                                packets: 0,
                                srcPort: undefined,
                                dstPort: undefined
                            },
                        };
                    }

                    if (protocol === 'tcp') {
                        trafficMap[key].tcp.bytes += bytes;
                        trafficMap[key].tcp.packets += packets;
                        trafficMap[key].tcp.srcPort = ports.srcPort;
                        trafficMap[key].tcp.dstPort = ports.dstPort;
                    } else if (protocol === 'udp') {
                        trafficMap[key].udp.bytes += bytes;
                        trafficMap[key].udp.packets += packets;
                        trafficMap[key].udp.srcPort = ports.srcPort;
                        trafficMap[key].udp.dstPort = ports.dstPort;
                    }
                }
            }
        }
        return Object.values(trafficMap);
    } catch (error) {
        console.error('Error fetching traffic stats:', error);
        return [];
    }
}

function transformToUnionTrafficData(originalData: RawMetric[]): UnionRawMetric[] {
    const resultMap = new Map<string, any>();

    // Сначала создаем структуру для каждого уникального источника
    originalData.forEach(item => {
        const fromKey = `${item.from.ip}-${item.from.name}`;

        if (!resultMap.has(fromKey)) {
            resultMap.set(fromKey, {
                name: item.from.name,
                ip: item.from.ip,
                to: []
            });
        }
    });

    // Затем заполняем данные о трафике
    originalData.forEach(item => {
        const fromKey = `${item.from.ip}-${item.from.name}`;
        const container = resultMap.get(fromKey);

        if (container) {
            container.to.push({
                ip: item.to.ip,
                name: item.to.name,
                traffic: {
                    tcp: item.tcp,
                    udp: item.udp
                }
            });
        }
    });

    return Array.from(resultMap.values());
}

async function getContainerStats(container: Container): Promise<ContainerStats | undefined> {
    try {
        // Получаем поток статистики
        const statsStream = await container.stats({ stream: false }); // stream: false для однократного получения данных

        // CPU
        const cpuDelta = statsStream.cpu_stats.cpu_usage.total_usage - statsStream.precpu_stats.cpu_usage.total_usage;
        const systemDelta = statsStream.cpu_stats.system_cpu_usage - statsStream.precpu_stats.system_cpu_usage;
        const cpuUsage = (cpuDelta / systemDelta) * statsStream.cpu_stats.online_cpus * 100;

        // RAM
        const memoryUsage = statsStream.memory_stats.usage;
        const memoryLimit = statsStream.memory_stats.limit;
        const memoryPercentage = (memoryUsage / memoryLimit) * 100;

        // HDD (blkio)
        const blkioStats = statsStream.blkio_stats?.io_service_bytes_recursive || [];
        const hddRead = blkioStats.find(stat => stat.op === 'Read')?.value || 0;
        const hddWrite = blkioStats.find(stat => stat.op === 'Write')?.value || 0;

        // Network IO
        const networks = statsStream.networks || {};
        let netInput = 0;
        let netOutput = 0;
        for (const network of Object.values(networks)) {
            netInput += network.rx_bytes;
            netOutput += network.tx_bytes;
        }

        return {
            cpuUsage: cpuUsage.toFixed(2) + '%',
            memoryUsage: (memoryUsage / 1024 / 1024).toFixed(2) + ' MB',
            memoryLimit: (memoryLimit / 1024 / 1024).toFixed(2) + ' MB',
            memoryPercentage: memoryPercentage.toFixed(2) + '%',
            hddRead: (hddRead / 1024 / 1024).toFixed(2) + ' MB',
            hddWrite: (hddWrite / 1024 / 1024).toFixed(2) + ' MB',
            netInput: (netInput / 1024 / 1024).toFixed(2) + ' MB',
            netOutput: (netOutput / 1024 / 1024).toFixed(2) + ' MB'
        };
    } catch (error) {
        console.error(`Ошибка получения статистики для контейнера`, error);
        return undefined;
    }
}

async function getContainerLogs(container: Container, logCount: number): Promise<string> {
    const logBuffer = await container.logs({
        stdout: true,
        stderr: true,
        follow: false,
        tail: logCount,
    });

    return logBuffer.toString();
}

async function enrichContainerData(unionRawMetric: UnionRawMetricWithId[], allContainers: ContainerInfo[] | undefined): Promise<RichContainerData[]> {
    if(!allContainers) {
        throw new Error('No containers found.');
    }

    const result: RichContainerData[] = [];
    for(const unionMetric of unionRawMetric) {
        const containerInfo = allContainers.find(x => x.Id === unionMetric.id);

        if(!containerInfo) {
            continue;
        }

        const container = docker.getContainer(containerInfo.Id);
        //const logs = await getContainerLogs(container, 30);
        const logs = "123";
        const stats = await getContainerStats(container);

        result.push({
            ...unionMetric,
            status: {
                status: containerInfo.Status,
                state: containerInfo.State,
            },
            imageName: containerInfo.Image,
            ports: containerInfo.Ports.map(x => ({ private: x.PrivatePort, public: x.PublicPort })),
            logs,
            stats
        });
    }

    return result;
}

async function unionWithMissedContainers(networkName: string, existingContainers: UnionRawMetric[], allContainers: ContainerInfo[] | undefined): Promise<UnionRawMetricWithId[]> {
    const result: UnionRawMetricWithId[] = [];

    if(!allContainers) {
        return [];
    }

    const containersWithSameNetwork = allContainers.filter(x => x.NetworkSettings.Networks[networkName] !== undefined);
    for(const container of containersWithSameNetwork) {
        const existContainer = existingContainers.find(unionRaw =>
            container.Names.some(x => x.includes(unionRaw.name)) &&
            container.NetworkSettings.Networks[networkName].IPAddress == unionRaw.ip
        );

        if(existContainer) {
            result.push({
                ...existContainer,
                id: container.Id,
            });
            continue;
        }

        result.push({
            name: container.Names[0].split('/')[1],
            ip: container.NetworkSettings.Networks[networkName].IPAddress, // Он будет пустой
            id: container.Id,
            to: [],
        });
    }

    return result;
}

function transformToUnionTrafficDataWithPorts(originalData: RawMetric[]): UnionRawMetric[] {
    const resultMap = new Map<string, any>();

    originalData.forEach(item => {
        const fromKey = `${item.from.ip}-${item.from.name}`;

        if (!resultMap.has(fromKey)) {
            resultMap.set(fromKey, {
                name: item.from.name,
                ip: item.from.ip,
                to: []
            });
        }

        const container = resultMap.get(fromKey);
        if (container) {
            container.to.push({
                ip: item.to.ip,
                name: item.to.name,
                traffic: {
                    tcp: {
                        bytes: item.tcp.bytes,
                        packets: item.tcp.packets,
                        srcPort: item.tcp.srcPort,
                        dstPort: item.tcp.dstPort
                    },
                    udp: {
                        bytes: item.udp.bytes,
                        packets: item.udp.packets,
                        srcPort: item.udp.srcPort,
                        dstPort: item.udp.dstPort
                    }
                }
            });
        }
    });

    return Array.from(resultMap.values());
}

export async function monitorTraffic(hosts: { name: string; ip: string; }[]): Promise<Response> {
    hostsThis = hosts;

    const networksTopologies = await getNetworksTopologies();
    const allContainers = await getDockerContainers();

    const trafficDiffResult: NetworkResponse[] = [];

    const { stdout: iptablesStdout } = await execAsync('iptables -L FORWARD -v -x -n');
    const iptablesLines = iptablesStdout.split('\n');

    for (const networksTopology of networksTopologies) {
        const currentStats = await getTrafficStatsWithPorts(networksTopology.containers, iptablesLines);
        const unionTrafficData = transformToUnionTrafficData(currentStats);
        const missedAndTrafficContainers = await unionWithMissedContainers(networksTopology.name, unionTrafficData, allContainers);

        trafficDiffResult.push({
            name: networksTopology.name,
            driver: networksTopology.driver,
            containers: await enrichContainerData(missedAndTrafficContainers, allContainers),
        });
    }

    await clearStatistic();
    await setup();

    return {
        timestamp: new Date().toISOString(),
        networks: trafficDiffResult,
    };
}

export async function clearStatistic() {
    // Сбрасываем данные и правила
    await execAsync('iptables -Z FORWARD');
    //await execAsync('iptables -F FORWARD');
}

export async function stopContainer(containerId: string) {
    const allContainers = await getDockerContainers();
    if(!allContainers) {
        throw new Error('No containers found.');
    }

    const containerRaw = allContainers.find(x => x.Id === containerId);
    if(!containerRaw) {
        throw new Error('No container found.');
    }

    const container = docker.getContainer(containerRaw.Id);

    if (containerRaw.State === 'paused') {

        try {
            await container.unpause();
        } catch (error) {
            console.log(error);
        }
    }

    try {
        await container.stop({ t: 3 });
    } catch (e) {
        console.error(e);
    }
}

export async function startContainer(containerId: string) {
    const allContainers = await getDockerContainers();
    if(!allContainers) {
        throw new Error('No containers found.');
    }

    const containerRaw = allContainers.find(x => x.Id === containerId);
    if(!containerRaw) {
        throw new Error('No container found.');
    }

    const container = docker.getContainer(containerRaw.Id);
    console.log('Start', containerId, container);
    await container.start({});
    try {
        await container.start({});
    } catch (e) {
        console.error(e);
    }
}

export async function removeContainer(containerId: string) {
    const allContainers = await getDockerContainers();
    if(!allContainers) {
        throw new Error('No containers found.');
    }

    const containerRaw = allContainers.find(x => x.Id === containerId);
    if(!containerRaw) {
        throw new Error('No container found.');
    }

    const container = docker.getContainer(containerRaw.Id);
    console.log('Remove', containerId, container);

    try {
        const container = docker.getContainer(containerId);
        await container.remove({ force: true }); // Принудительное удаление
        console.log(`Контейнер ${containerId} успешно удален.`);
    } catch (error) {
        console.error(`Ошибка при удалении контейнера ${containerId}:`, error);
    }
}