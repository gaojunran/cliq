<script setup lang="ts">
import { useCliq } from "./composables/useCliq";
import {
  AppHeader,
  AppDescription,
  SubcommandSelector,
  ParameterSection,
  CommandPreview,
  CommandActions,
  EmptyState,
  ResultDialog,
} from "./components";
import { provide } from "vue";

const {
  cliqJson,
  selectedSubcommand,
  commandValues,
  booleanFlags,
  isDark,
  isExecuting,
  commandOutput,
  commandError,
  builtCommand,
  isCopied,
  showResultDialog,
  toggleTheme,
  commandPreview,
  cascadeOptions,
  currentCommand,
  requiredParams,
  optionalParams,
  runCommand,
  copyCommand,
  registerDragTarget,
  unregisterDragTarget,
  dragState,
} = useCliq();

// Provide drag & drop context to child components
provide("dragAndDrop", {
  registerDragTarget,
  unregisterDragTarget,
  dragState,
});
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] transition-colors duration-200"
  >
    <!-- Header -->
    <AppHeader
      :cliq-json="cliqJson"
      :is-dark="isDark"
      @toggle-theme="toggleTheme"
    />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Description -->
      <AppDescription :cliq-json="cliqJson" />

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Subcommand Selector -->
        <div class="lg:col-span-1">
          <SubcommandSelector
            :cascade-options="cascadeOptions"
            :selected-subcommand="selectedSubcommand"
            :current-command="currentCommand"
            @update:selected-subcommand="selectedSubcommand = $event"
          />
        </div>

        <!-- Right: Parameters Area -->
        <div class="lg:col-span-2">
          <div v-if="currentCommand" class="space-y-4">
            <!-- Required Parameters -->
            <ParameterSection
              title="Required Parameters"
              :args="requiredParams.args"
              :flags="requiredParams.flags"
              :command-values="commandValues"
              :boolean-flags="booleanFlags"
              :is-required="true"
            />

            <!-- Optional Parameters -->
            <ParameterSection
              title="Optional Parameters"
              :args="optionalParams.args"
              :flags="optionalParams.flags"
              :command-values="commandValues"
              :boolean-flags="booleanFlags"
              :is-required="false"
            />

            <!-- Command Preview -->
            <CommandPreview :command-preview="commandPreview" />

            <!-- Action Buttons -->
            <CommandActions
              :is-executing="isExecuting"
              :is-copied="isCopied"
              @run-command="runCommand"
              @copy-command="copyCommand"
            />
          </div>

          <!-- Empty State -->
          <EmptyState :visible="!selectedSubcommand && !!cliqJson" />
        </div>
      </div>
    </div>

    <!-- Result Dialog -->
    <ResultDialog
      v-model:visible="showResultDialog"
      :built-command="builtCommand"
      :command-output="commandOutput"
      :command-error="commandError"
    />
  </div>
</template>

<style scoped></style>
