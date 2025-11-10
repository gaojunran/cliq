<script setup lang="ts">
import InputText from "primevue/inputtext";
import ToggleSwitch from "primevue/toggleswitch";
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

function getHelp(param: Arg | Flag): string | undefined {
  if ("help_long" in param) {
    return (param as Flag).help_long || param.help || param.help_first_line;
  }
  return param.help || param.help_first_line;
}

function getPlaceholder(param: Arg | Flag): string {
  if ("arg" in param && (param as Flag).arg) {
    return (param as Flag).arg!.usage;
  }
  return param.usage;
}

function isBooleanFlag(flag: Flag): boolean {
  return !flag.arg;
}
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
      <div v-for="arg in args" :key="arg.name">
        <div class="flex items-center justify-between gap-2 mb-2">
          <label
            class="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            {{ arg.name }}
            <span v-if="isRequired" class="text-red-500">*</span>
          </label>
          <p
            v-if="getHelp(arg)"
            class="text-xs text-gray-500 dark:text-gray-400 flex-1 text-right"
          >
            {{ getHelp(arg) }}
          </p>
        </div>
        <InputText
          v-model="commandValues[arg.name]"
          :placeholder="getPlaceholder(arg)"
          class="w-full"
        />
      </div>

      <!-- Flags -->
      <div v-for="flag in flags" :key="flag.name">
        <div class="flex items-center justify-between gap-2 mb-2">
          <label
            class="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            {{ flag.name }}
            <span v-if="isRequired" class="text-red-500">*</span>
          </label>
          <p
            v-if="getHelp(flag)"
            class="text-xs text-gray-500 dark:text-gray-400 flex-1 text-right"
          >
            {{ getHelp(flag) }}
          </p>
        </div>

        <!-- Boolean Flag (Toggle) -->
        <div
          v-if="isBooleanFlag(flag)"
          class="flex items-center gap-3 p-2 bg-gray-50 dark:bg-[#1a1a1a] rounded border border-gray-200 dark:border-white/10"
        >
          <ToggleSwitch v-model="booleanFlags[flag.name]" />
          <span class="text-sm text-gray-600 dark:text-gray-400 font-mono">{{
            flag.usage
          }}</span>
        </div>

        <!-- Flag with value (Input) -->
        <InputText
          v-else
          v-model="commandValues[flag.name]"
          :placeholder="getPlaceholder(flag)"
          class="w-full"
        />
      </div>
    </div>
  </div>
</template>
