<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  inject,
  computed,
  nextTick,
  useTemplateRef,
} from "vue";
import InputText from "primevue/inputtext";
import ToggleSwitch from "primevue/toggleswitch";
import { Button, Textarea, Password } from "primevue";
import Popover from "primevue/popover";
import type { Arg, Flag } from "../types/types";
import { open } from "@tauri-apps/plugin-dialog";

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

const inputRef = useTemplateRef("input");
const popoverRef = useTemplateRef("popover");

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

function toggleLongHelp(show: boolean, event: Event) {
  const popover = popoverRef.value as InstanceType<typeof Popover>;
  if (popover) {
    if (show) {
      popover.show(event);
    } else {
      popover.hide();
    }
  }
}

function getShortHelp(param: Arg | Flag): string | undefined {
  return (
    param.help_first_line ??
    param.help?.split("\n")[0] ??
    param.help_long?.split("\n")[0]
  );
}

function getLongHelp(param: Arg | Flag): string | undefined {
  // get a longer help than `getShortHelp`
  const shortHelpLength = getShortHelp(param)?.length ?? 0;
  if (param.help_long?.length ?? 0 > shortHelpLength) {
    return param.help_long;
  } else if (param.help && param.help.length > shortHelpLength) {
    return param.help;
  }
  return undefined;
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

async function invokeFileDirPicker() {
  const file = await open({
    multiple: false, // TODO: support multiple selection
    directory: props.param.type === "dir",
  });
  if (file && typeof file === "string") {
    emit("update:modelValue", file);
  }
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
        <i
          class="pi pi-question-circle text-black/50 dark:text-white/50"
          v-if="getLongHelp(param)"
          @mouseenter="toggleLongHelp(true, $event)"
          @mouseleave="toggleLongHelp(false, $event)"
        >
        </i>
        <Popover ref="popover">
          <div>{{ getLongHelp(param) }}</div>
        </Popover>
      </label>
      <p
        v-if="getShortHelp(param)"
        class="text-xs text-black/50 dark:text-white/50 flex-1 text-right"
      >
        {{ getShortHelp(param) }}
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
    <Textarea
      v-else-if="param.type === 'textarea'"
      :model-value="(modelValue as string) || ''"
      @update:model-value="$emit('update:modelValue', $event as string)"
      :placeholder="getPlaceholder(param)"
      class="w-full"
    />
    <div class="flex" v-else>
      <!-- Text Input (Arg or Flag with value) -->
      <InputText
        ref="input"
        :model-value="(modelValue as string) || ''"
        @update:model-value="$emit('update:modelValue', $event as string)"
        :placeholder="getPlaceholder(param)"
        :class="[
          'w-full transition-all flex-1 font-mono!',
          isDragging &&
            'ring-2! ring-blue-500! ring-opacity-50! bg-blue-50! dark:bg-blue-900/20!',
        ]"
      />

      <Button
        v-if="param?.type === 'file' || param?.type === 'dir'"
        class="ml-2"
        severity="secondary"
        :icon="
          'pi pi-' +
          (param?.type === 'file' ? 'file' : '') +
          (param?.type === 'dir' ? 'folder' : '')
        "
        @click="invokeFileDirPicker"
      />
    </div>
  </div>
</template>
