<script setup lang="ts">
import CascadeSelect from "primevue/cascadeselect";
import type { CascadeOption, Command } from "../types/types";

interface Props {
  cascadeOptions: CascadeOption[];
  selectedSubcommand: CascadeOption | null;
  currentCommand: Command | null;
}

interface Emits {
  (e: "update:selectedSubcommand", value: CascadeOption | null): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
  <div
    v-if="cascadeOptions.length > 0"
    class="bg-white dark:bg-[#0f0f0f] rounded-lg overflow-hidden border border-gray-200 dark:border-white/10"
  >
    <div
      class="px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-white/10"
    >
      <h3
        class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide"
      >
        Subcommand
      </h3>
    </div>

    <div class="p-4">
      <CascadeSelect
        :model-value="selectedSubcommand"
        @update:model-value="$emit('update:selectedSubcommand', $event)"
        :options="cascadeOptions"
        optionLabel="name"
        optionGroupLabel="name"
        :optionGroupChildren="['subcommands']"
        placeholder="Select a subcommand"
        class="w-full"
      >
        <template #option="slotProps">
          <div class="flex items-center gap-2">
            <i
              :class="[
                'pi text-sm',
                slotProps.option.subcommands &&
                slotProps.option.subcommands.length > 0
                  ? 'pi-folder text-green-500'
                  : 'pi-file text-gray-400',
              ]"
            ></i>
            <span
              :class="[
                slotProps.option.subcommands &&
                slotProps.option.subcommands.length > 0
                  ? 'font-semibold text-gray-900 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300',
              ]"
            >
              {{ slotProps.option.name }}
            </span>
          </div>
        </template>
      </CascadeSelect>

      <!-- 子命令描述 -->
      <p
        v-if="currentCommand?.help"
        class="mt-3 text-xs text-gray-600 dark:text-gray-400 leading-relaxed"
      >
        {{ currentCommand.help }}
      </p>
    </div>
  </div>
</template>
