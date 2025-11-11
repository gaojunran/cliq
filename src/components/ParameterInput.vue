<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject, computed, nextTick } from "vue";
import InputText from "primevue/inputtext";
import ToggleSwitch from "primevue/toggleswitch";
import type { Arg, Flag } from "../types/types";

interface Props {
  param: Arg | Flag;
  modelValue: string | boolean;
  isFlag?: boolean;
  isRequired?: boolean;
}

interface Emits {
  (e: "update:modelValue", value: string | boolean): void;
}

const props = defineProps<Props>();
// emit is used in template via $emit
const emit = defineEmits<Emits>();

const inputRef = ref<InstanceType<typeof InputText> | null>(null);

// Inject drag & drop context from App.vue
const dragAndDrop = inject<{
  registerDragTarget: (paramName: string, element: HTMLElement) => void;
  unregisterDragTarget: (paramName: string) => void;
  dragState: Record<string, boolean>;
}>("dragAndDrop");

// Get dragging state for this input
const isDragging = computed(() => {
  return dragAndDrop?.dragState[props.param.name] ?? false;
});

function getHelp(param: Arg | Flag): string | undefined {
  if ("help_long" in param) {
    return param.help_long || param.help || param.help_first_line;
  }
  return param.help || param.help_first_line;
}

function isBoolean(param: Arg | Flag): boolean {
  // Check if it's a Flag type (has 'long' or 'short' property)
  // and doesn't have an 'arg' value (boolean flag)
  if ("long" in param || "short" in param) {
    const flag = param as Flag;
    return !flag.arg;
  }
  return false;
}

function getPlaceholder(param: Arg | Flag): string {
  if ("arg" in param && param.arg) {
    return param.arg.usage;
  }
  return param.usage;
}

onMounted(async () => {
  // Wait for component to be fully mounted
  await nextTick();

  // Register this input for drag & drop tracking
  // Get the actual DOM element from the PrimeVue component
  if (inputRef.value && dragAndDrop) {
    const element = (inputRef.value as any).$el as HTMLElement;
    if (element) {
      dragAndDrop.registerDragTarget(props.param.name, element);
    }
  }
});

onUnmounted(() => {
  // Unregister this input
  if (dragAndDrop) {
    dragAndDrop.unregisterDragTarget(props.param.name);
  }
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-2 mb-2">
      <label
        class="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
      >
        {{ param.name }}
        <span v-if="isRequired" class="text-red-500">*</span>
      </label>
      <p
        v-if="getHelp(param)"
        class="text-xs text-gray-500 dark:text-gray-400 flex-1 text-right"
      >
        {{ getHelp(param) }}
      </p>
    </div>

    <!-- Boolean Flag (Toggle) -->
    <div
      v-if="isFlag && isBoolean(param)"
      class="flex items-center gap-3 p-2 bg-gray-50 dark:bg-[#1a1a1a] rounded border border-gray-200 dark:border-white/10"
    >
      <ToggleSwitch
        :model-value="modelValue as boolean"
        @update:model-value="$emit('update:modelValue', $event)"
      />
      <span class="text-sm text-gray-600 dark:text-gray-400 font-mono">{{
        param.usage
      }}</span>
    </div>

    <!-- Text Input (Arg or Flag with value) -->
    <InputText
      v-else
      ref="inputRef"
      :model-value="(modelValue as string) || ''"
      @update:model-value="$emit('update:modelValue', $event as string)"
      :placeholder="getPlaceholder(param)"
      :class="[
        'w-full transition-all',
        isDragging &&
          'ring-2! ring-blue-500! ring-opacity-50! bg-blue-50 dark:bg-blue-900/20',
      ]"
    />
  </div>
</template>
