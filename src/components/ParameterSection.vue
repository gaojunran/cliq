<script setup lang="ts">
import ParameterInput from "./ParameterInput.vue";
import type { Arg, Flag } from "../types/types";

interface Props {
  title: string;
  args: Arg[];
  flags: Flag[];
  commandValues: Record<string, string>;
  booleanFlags: Record<string, boolean>;
  isRequired?: boolean;
}

defineProps<Props>();
</script>

<template>
  <div
    v-if="args.length > 0 || flags.length > 0"
    class="bg-white dark:bg-[#0A0A0B] rounded-lg overflow-hidden border border-gray-200 dark:border-white/10"
  >
    <div
      class="px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-white/10"
    >
      <h3
        class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2"
      >
        {{ title }}
      </h3>
    </div>

    <div class="p-4 space-y-4">
      <!-- Arguments -->
      <ParameterInput
        v-for="arg in args"
        :key="arg.name"
        :param="arg"
        :is-flag="false"
        :is-required="isRequired"
        :model-value="commandValues[arg.name] || ''"
        @update:model-value="commandValues[arg.name] = $event as string"
      />

      <!-- Flags -->
      <ParameterInput
        v-for="flag in flags"
        :key="flag.name"
        :param="flag"
        :is-flag="true"
        :is-required="isRequired"
        :model-value="
          flag.arg
            ? commandValues[flag.name] || ''
            : booleanFlags[flag.name] || false
        "
        @update:model-value="
          flag.arg
            ? (commandValues[flag.name] = $event as string)
            : (booleanFlags[flag.name] = $event as boolean)
        "
      />
    </div>
  </div>
</template>
