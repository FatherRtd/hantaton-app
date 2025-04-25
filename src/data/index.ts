import { defineConfigs } from "v-network-graph";
import type { MetricResponse } from "@/models/ContainerResponse.ts";

const configs = defineConfigs({
  view: {
    scalingObjects: true,
  },
  node: {
    selectable: true,
  },
  edge: {
    normal: {
      width: 1,
      color: "#666666",
    },
    hover: {
      color: "#666666",
    },
    marker: {
      target: {
        type: "arrow",
      },
    },
  },
});

const mockMetricResponse: MetricResponse = {
  timestamp: new Date().toISOString(),
  networks: [
    {
      name: "network-alpha",
      containers: [
        {
          name: "alpha-container-1",
          ip: "10.0.0.1",
          id: "alpha-1",
          status: { status: "running", state: "healthy" },
          ports: [
            { public: 8001, private: 80 },
            { public: 8443, private: 443 },
          ],
          imageName: "nginx:latest",
          to: [
            {
              name: "alpha-container-2",
              ip: "10.0.0.2",
              traffic: {
                tcp: { bytes: 1000000, packets: 1000 },
                udp: { bytes: 50000, packets: 100 },
              },
            },
          ],
        },
        {
          name: "alpha-container-2",
          ip: "10.0.0.2",
          id: "alpha-2",
          status: { status: "running", state: "healthy" },
          ports: [{ public: 3000, private: 3000 }],
          imageName: "node:18",
          to: [
            {
              name: "alpha-container-3",
              ip: "10.0.0.3",
              traffic: {
                tcp: { bytes: 800000, packets: 800 },
                udp: { bytes: 30000, packets: 60 },
              },
            },
          ],
        },
        {
          name: "alpha-container-3",
          ip: "10.0.0.3",
          id: "alpha-3",
          status: { status: "exited", state: "unhealthy" },
          ports: [{ public: 5000, private: 5000 }],
          imageName: "redis:7",
          to: [],
        },
      ],
    },
    {
      name: "network-beta",
      containers: [
        {
          name: "beta-container-1",
          ip: "10.1.0.1",
          id: "beta-1",
          status: { status: "running", state: "healthy" },
          ports: [{ public: 9000, private: 9000 }],
          imageName: "postgres:15",
          to: [
            {
              name: "beta-container-2",
              ip: "10.1.0.2",
              traffic: {
                tcp: { bytes: 300000, packets: 400 },
                udp: { bytes: 1000, packets: 10 },
              },
            },
          ],
        },
        {
          name: "beta-container-2",
          ip: "10.1.0.2",
          id: "beta-2",
          status: { status: "paused", state: "unknown" },
          ports: [{ public: 6379, private: 6379 }],
          imageName: "mongo:6",
          to: [
            {
              name: "beta-container-1",
              ip: "10.1.0.2",
              traffic: {
                tcp: { bytes: 300000, packets: 400 },
                udp: { bytes: 1000, packets: 10 },
              },
            },
            {
              name: "beta-container-3",
              ip: "10.1.0.3",
              traffic: {
                tcp: { bytes: 500000, packets: 600 },
                udp: { bytes: 2000, packets: 20 },
              },
            },
          ],
        },
        {
          name: "beta-container-3",
          ip: "10.1.0.3",
          id: "beta-3",
          status: { status: "running", state: "starting" },
          ports: [{ public: 7000, private: 7000 }],
          imageName: "alpine:latest",
          to: [],
        },
      ],
    },
  ],
};

export default {
  configs,
  mockMetricResponse,
};
