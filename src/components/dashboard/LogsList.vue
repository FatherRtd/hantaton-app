<script setup lang="ts"></script>

<template>
  <el-scrollbar>
    <div v-for="i in 50" :key="i">
      <div>log {{ i }}</div>
    </div>
  </el-scrollbar>
</template>

<style scoped></style>
