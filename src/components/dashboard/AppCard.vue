<template>
  <div class="bg-white dark:bg-gray-800 shadow-xs rounded-xl h-[300px]">
    <header class="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
      <h2 class="font-semibold text-gray-800 dark:text-gray-100">{{ label }}</h2>
    </header>
    <div class="p-3">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
const { label = "Card" } = defineProps<{
  label?: string;
}>();
</script>
