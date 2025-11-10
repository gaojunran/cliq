<script setup lang="ts">
import Button from "primevue/button";
import type { CliqJson } from "../types/types";

interface Props {
  cliqJson: CliqJson | null;
  isDark: boolean;
}

interface Emits {
  (e: "toggle-theme"): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
  <div
    class="bg-white dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-white/10"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo 和标题 -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3">
            <i class="pi pi-terminal text-green-500 text-2xl"></i>
            <div>
              <h1
                v-if="cliqJson"
                class="text-xl font-bold text-gray-900 dark:text-white"
              >
                {{ cliqJson.name }}
              </h1>
              <p
                v-if="cliqJson?.version"
                class="text-xs text-gray-500 dark:text-gray-400"
              >
                v{{ cliqJson.version }}
              </p>
            </div>
          </div>
        </div>

        <!-- 主题切换 -->
        <Button
          :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
          rounded
          text
          severity="secondary"
          @click="$emit('toggle-theme')"
          class="hover:bg-gray-100 dark:hover:bg-gray-800"
        />
      </div>
    </div>
  </div>
</template>
