<template>
  <li
    class="pl-4 pr-3 py-2 rounded-lg mb-0.5 last:mb-0 bg-linear-to-r from-violet-500/[0.12] dark:from-violet-500/[0.24] to-violet-500/[0.04]"
  >
    <slot :handleClick="handleClick" :expanded="expanded" />
  </li>
</template>

<script setup lang="ts">
import { ref } from "vue";

const expanded = ref(true);

const handleClick = () => {
  expanded.value = !expanded.value;
};
</script>
