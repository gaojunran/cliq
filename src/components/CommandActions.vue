<script setup lang="ts">
interface Props {
  isExecuting: boolean;
  isCopied: boolean;
}

interface Emits {
  (e: "run-command"): void;
  (e: "copy-command"): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
  <div
    class="bg-white dark:bg-[#0f0f0f] rounded-lg overflow-hidden border border-gray-200 dark:border-white/10"
  >
    <div class="grid grid-cols-2 gap-0">
      <button
        @click="$emit('run-command')"
        :disabled="isExecuting"
        class="bg-[#10b981] hover:bg-[#059669] active:bg-[#047857] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 transition-all duration-200 flex items-center justify-center gap-3 group border-r border-white/10 cursor-pointer"
      >
        <svg
          v-if="!isExecuting"
          class="w-5 h-5 group-hover:scale-110 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <svg
          v-else
          class="w-5 h-5 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span class="text-base">{{
          isExecuting ? "Executing..." : "Execute"
        }}</span>
      </button>

      <button
        @click="$emit('copy-command')"
        class="bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white font-semibold py-3 px-6 transition-all duration-200 flex items-center justify-center gap-3 group cursor-pointer"
      >
        <svg
          v-if="!isCopied"
          class="w-5 h-5 group-hover:scale-110 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <svg
          v-else
          class="w-5 h-5 text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span class="text-base">{{ isCopied ? "Copied!" : "Copy" }}</span>
      </button>
    </div>
  </div>
</template>
