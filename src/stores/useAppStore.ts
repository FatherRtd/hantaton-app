import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type { ContainerResponse, NetworkResponse } from "@/models/ContainerResponse.ts";

export const useAppStore = defineStore("appStore", () => {
  const selectedNetwork = ref<NetworkResponse>();

  const selectNetwork = (network: NetworkResponse | undefined) => {
    selectedNetwork.value = network;
  };

  const selectedContainer = ref<ContainerResponse>();
  const selectContainer = (container: ContainerResponse | undefined) => {
    selectedContainer.value = container;
  };

  watch(selectedNetwork, () => {
    selectContainer(undefined);
  });

  return { selectedNetwork, selectNetwork, selectedContainer, selectContainer };
});
