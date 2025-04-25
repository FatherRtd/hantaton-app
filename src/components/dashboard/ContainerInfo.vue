<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useAppStore } from "@/stores/useAppStore.ts";

const { selectedContainer } = storeToRefs(useAppStore());
</script>

<template>
  <div>
    <div>Id: {{ selectedContainer.id }}</div>
    <div>IP: {{ selectedContainer.ip }}</div>
    <div class="flex space-x-2">
      <div>Ports:</div>
      <div>
        <div v-for="(port, index) in selectedContainer.ports" :key="index">
          <div>public - {{ port.public }}, private - {{ port.private }}</div>
        </div>
      </div>
    </div>
    <div>Image: {{ selectedContainer.imageName }}</div>
  </div>
</template>

<style scoped></style>
