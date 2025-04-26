export interface IContainerStats {
  cpuUsage: string;
  memoryUsage: string;
  memoryLimit: string;
  memoryPercentage: string;
  hddRead: string;
  hddWrite: string;
  netInput: string;
  netOutput: string;
}

export interface IRichContainerData {
  name: string;
  ip: string;
  id: string;
  networkName: string;
  status: {
    status: string;
    state: string;
  };
  ports: {
    public: number;
    private: number;
  }[];
  imageName: string;
  stats?: IContainerStats;
  logs: string;
  to: {
    name: string;
    ip: string;
    port: number;
    traffic: {
      tcp: {
        bytes: number;
        packets: number;
      };
      udp: {
        bytes: number;
        packets: number;
      };
    };
  }[];
}

export interface IHostResponse {
  name: string;
  ip: string;
  containers: IRichContainerData[];
}

export interface IMetricResponse {
  timestamp: string;
  hosts: IHostResponse[];
}
