export type ContainerResponse = {
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
    to: {
        name: string;
        ip: string;
        traffic: {
            tcp: {
                bytes: number,
                packets: number
            },
            udp: {
                bytes: number,
                packets: number
            }
        }
    }[];
}

export type NetworkResponse = {
    name: string;
    containers: ContainerResponse[];
}

export type MetricResponse = {
    timestamp: string;
    networks: NetworkResponse[];
}