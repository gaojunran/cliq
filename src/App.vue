<script setup lang="ts">
import { useCliq } from "./composables/useCliq";
import { getCurrentWebview } from "@tauri-apps/api/webview";
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
import { onMounted, onUnmounted, provide, reactive } from "vue";

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
} = useCliq();

// Drag and drop state
const dragTargets = reactive<Map<string, HTMLElement>>(new Map());
const dragState = reactive<Record<string, boolean>>({});
let unlisten: (() => void) | null = null;

// Register/unregister input elements for drag & drop
function registerDragTarget(paramName: string, element: HTMLElement) {
  dragTargets.set(paramName, element);
}

function unregisterDragTarget(paramName: string) {
  dragTargets.delete(paramName);
  delete dragState[paramName];
}

// Provide drag & drop context to child components
provide("dragAndDrop", {
  registerDragTarget,
  unregisterDragTarget,
  dragState,
});

onMounted(async () => {
  unlisten = await getCurrentWebview().onDragDropEvent((event) => {
    if (event.payload.type === "over") {
      const { x, y } = event.payload.position;
      console.log(`Over event at (${x}, ${y})`);

      // Reset all drag states
      Object.keys(dragState).forEach((key) => {
        dragState[key] = false;
      });

      // Use document.elementFromPoint to find the element under the cursor
      const elementAtPoint = document.elementFromPoint(x, y);
      console.log("Element at point:", elementAtPoint);

      if (elementAtPoint) {
        // Check which registered input contains this element
        dragTargets.forEach((element, paramName) => {
          if (element === elementAtPoint || element.contains(elementAtPoint)) {
            console.log(`Drag over: ${paramName}`);
            dragState[paramName] = true;
          }
        });
      }
    } else if (event.payload.type === "drop") {
      const { x, y } = event.payload.position;
      console.log(`Drop event at (${x}, ${y})`);

      // Use document.elementFromPoint to find the element under the cursor
      const elementAtPoint = document.elementFromPoint(x, y);
      console.log("Element at drop point:", elementAtPoint);

      if (elementAtPoint) {
        // Find which registered input received the drop
        dragTargets.forEach((element, paramName) => {
          if (element === elementAtPoint || element.contains(elementAtPoint)) {
            const paths = (event.payload as any).paths;
            const filePath = paths?.[0] ?? "";
            console.log(`Drop on: ${paramName}, file: ${filePath}`);
            if (filePath) {
              // Update the corresponding value
              commandValues.value[paramName] = filePath;
            }
          }
        });
      }

      // Reset all drag states
      Object.keys(dragState).forEach((key) => {
        dragState[key] = false;
      });
    } else {
      // cancelled
      Object.keys(dragState).forEach((key) => {
        dragState[key] = false;
      });
    }
  });
});

onUnmounted(() => {
  if (unlisten) {
    unlisten();
  }
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
