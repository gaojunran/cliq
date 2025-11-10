<script setup lang="ts">
interface Props {
  visible: boolean;
}

defineProps<Props>();
</script>

<template>
  <div
    v-if="visible"
    class="bg-white dark:bg-[#0f0f0f] rounded-lg border border-gray-200 dark:border-white/10 p-12 text-center"
  >
    <i
      class="pi pi-code text-6xl text-gray-300 dark:text-gray-700 mb-4"
    ></i>
    <p class="text-gray-500 dark:text-gray-500">
      Select a subcommand to begin
    </p>
  </div>
</template>
