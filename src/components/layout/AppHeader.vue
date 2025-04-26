<template>
  <header
    class="sticky top-0 before:absolute before:inset-0 before:backdrop-blur-md max-lg:before:bg-white/90 dark:max-lg:before:bg-gray-800/90 before:-z-10 z-30 'before:bg-white after:absolute after:h-px after:inset-x-0 after:top-full after:bg-gray-200 dark:after:bg-gray-700/60 after:-z-10' 'dark:before:bg-gray-800' 'dark:before:bg-gray-900'"
  >
    <div class="px-4 sm:px-6 lg:px-8">
      <div
        class="flex items-center justify-between h-16 lg:border-b border-gray-200 dark:border-gray-700/60"
      >
        <div class="flex"></div>

        <div class="flex items-center space-x-3">
          <ThemeToggle />

          <hr class="w-px h-6 bg-gray-200 dark:bg-gray-700/60 border-none" />

          <UserMenu />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import ThemeToggle from "../ThemeToggle.vue";
import UserMenu from "../DropdownProfile.vue";
import { Upload } from "@element-plus/icons-vue";
</script>
