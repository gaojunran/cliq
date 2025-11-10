<script setup lang="ts">
import type { CliqJson } from "../types/types";

interface Props {
  cliqJson: CliqJson | null;
}

defineProps<Props>();
</script>

<template>
  <div v-if="cliqJson?.description || cliqJson?.cmd.help" class="mb-6">
    <p
      v-if="cliqJson.description"
      class="text-gray-600 dark:text-gray-400 mb-2"
    >
      {{ cliqJson.description }}
    </p>
    <p
      v-if="cliqJson.cmd.help"
      class="text-sm text-gray-500 dark:text-gray-500"
    >
      {{ cliqJson.cmd.help }}
    </p>
  </div>
</template>
