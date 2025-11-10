<script setup lang="ts">
interface Props {
  commandPreview: string;
}

defineProps<Props>();
</script>

<template>
  <div
    class="bg-white dark:bg-[#0A0A0B] rounded-lg overflow-hidden border border-gray-200 dark:border-white/10"
  >
    <div
      class="px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-white/10"
    >
      <h3
        class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2"
      >
        <i class="pi pi-terminal text-green-500 text-xs"></i>
        Command Preview
      </h3>
    </div>
    <div class="p-4">
      <div
        class="bg-gray-100 dark:bg-[#0A0A0B] rounded p-3 font-mono text-xs text-gray-800 dark:text-[#10b981] break-all border border-gray-200 dark:border-white/10"
      >
        <span class="text-gray-500 dark:text-gray-600 mr-2">$</span
        >{{ commandPreview }}
      </div>
    </div>
  </div>
</template>
