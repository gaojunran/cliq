<script setup lang="ts">
import Dialog from "primevue/dialog";

interface Props {
  visible: boolean;
  builtCommand: string;
  commandOutput: string;
  commandError: string;
}

interface Emits {
  (e: "update:visible", value: boolean): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    modal
    :header="commandOutput ? 'Execution Success' : 'Execution Error'"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <div class="space-y-4">
      <!-- 执行的命令 -->
      <div>
        <h4
          class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
        >
          Command:
        </h4>
        <div
          class="bg-gray-100 dark:bg-black/40 rounded p-3 font-mono text-xs text-gray-800 dark:text-green-400 break-all border border-gray-200 dark:border-gray-800"
        >
          <span class="text-gray-500 dark:text-gray-600 mr-2">$</span
          >{{ builtCommand }}
        </div>
      </div>

      <!-- 成功输出 -->
      <div v-if="commandOutput">
        <h4
          class="text-sm font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2"
        >
          <i
            class="pi pi-check-circle text-green-600 dark:text-green-400"
          ></i>
          Output:
        </h4>
        <div
          class="bg-green-50 dark:bg-green-950/20 border border-green-300 dark:border-green-900 rounded p-4 max-h-96 overflow-auto"
        >
          <pre
            class="text-xs text-green-700 dark:text-green-400 whitespace-pre-wrap break-all font-mono"
            >{{ commandOutput }}</pre
          >
        </div>
      </div>

      <!-- 错误输出 -->
      <div v-if="commandError">
        <h4
          class="text-sm font-semibold text-red-700 dark:text-red-300 mb-2 flex items-center gap-2"
        >
          <i class="pi pi-times-circle text-red-600 dark:text-red-400"></i>
          Error:
        </h4>
        <div
          class="bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-900 rounded p-4 max-h-96 overflow-auto"
        >
          <pre
            class="text-xs text-red-700 dark:text-red-400 whitespace-pre-wrap break-all font-mono"
            >{{ commandError }}</pre
          >
        </div>
      </div>
    </div>
  </Dialog>
</template>
