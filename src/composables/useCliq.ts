import { ref, computed, watch, onMounted, onUnmounted, reactive } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { Command as ExecuteCommand } from "@tauri-apps/plugin-shell";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import {
  parseDefaultBool,
  checkSystemDarkTheme,
  applyTheme,
  buildCascadeOptions,
  filterParams,
  buildCommandArray as buildCommandArrayHelper,
} from "../utils/helpers";
import type { CliqJson, CascadeOption, Arg, Flag } from "../types/types";

export function useCliq() {
  // ==================== State ====================
  const cliqJson = ref<CliqJson | null>(null);
  const selectedSubcommand = ref<CascadeOption | null>(null);
  const commandValues = ref<Record<string, string>>({});
  const booleanFlags = ref<Record<string, boolean>>({});
  const isDark = ref(false);
  const isExecuting = ref(false);
  const commandOutput = ref<string>("");
  const commandError = ref<string>("");
  const builtCommand = ref<string>("");
  const isCopied = ref(false);
  const showResultDialog = ref(false);

  // Drag and drop state
  const dragTargets = reactive<Map<string, HTMLElement>>(new Map());
  const dragState = reactive<Record<string, boolean>>({});
  let unlisten: (() => void) | null = null;

  // ==================== Computed Properties ====================
  const currentCommand = computed(() => {
    return selectedSubcommand.value?.command ?? null;
  });

  const cascadeOptions = computed(() => {
    if (!cliqJson.value?.cmd.subcommands) return [];
    return buildCascadeOptions(cliqJson.value.cmd.subcommands);
  });

  const requiredParams = computed(() => {
    if (!currentCommand.value) return { args: [], flags: [] };
    return filterParams(
      currentCommand.value.args,
      currentCommand.value.flags,
      true,
    );
  });

  const optionalParams = computed(() => {
    if (!currentCommand.value) return { args: [], flags: [] };
    return filterParams(
      currentCommand.value.args,
      currentCommand.value.flags,
      false,
    );
  });

  const commandPreview = computed(() => {
    return buildCommandString() || "请选择子命令并填写参数";
  });

  // ==================== Theme Functions ====================
  function initializeTheme() {
    if (checkSystemDarkTheme()) {
      isDark.value = true;
      applyTheme(true);
    }
  }

  function toggleTheme() {
    isDark.value = !isDark.value;
    applyTheme(isDark.value);
  }

  // ==================== Command Building ====================
  function buildCommandArray(): string[] {
    if (!cliqJson.value || !selectedSubcommand.value || !currentCommand.value) {
      return [];
    }

    return buildCommandArrayHelper(
      cliqJson.value.bin,
      selectedSubcommand.value.fullCmd,
      currentCommand.value.flags,
      currentCommand.value.args,
      commandValues.value,
      booleanFlags.value,
    );
  }

  function buildCommandString(): string {
    return buildCommandArray().join(" ");
  }

  // ==================== Parameter Management ====================
  function clearAllParams() {
    commandValues.value = {};
    booleanFlags.value = {};
  }

  function resetParamsToDefaults() {
    clearAllParams();

    if (!selectedSubcommand.value) return;

    const cmd = selectedSubcommand.value.command;

    // Set default values for args
    cmd.args.forEach((arg: Arg) => {
      if (typeof arg.default !== "undefined") {
        commandValues.value[arg.name] = String(arg.default);
      }
    });

    // Set default values for flags
    cmd.flags.forEach((flag: Flag) => {
      if (flag.arg) {
        const def = flag.default ?? flag.arg?.default;
        if (typeof def !== "undefined") {
          commandValues.value[flag.name] = String(def);
        }
      } else {
        // Initialize all boolean flags (with default value or false)
        if (typeof flag.default !== "undefined") {
          booleanFlags.value[flag.name] = parseDefaultBool(flag.default);
        } else {
          booleanFlags.value[flag.name] = false;
        }
      }
    });
  }

  // ==================== API Functions ====================
  async function getCliqJson() {
    try {
      const jsonString: string = await invoke("get_cliq_json");
      cliqJson.value = JSON.parse(jsonString);
      console.log("Loaded CLI config:", cliqJson.value);
    } catch (error) {
      console.error("Failed to load CLI config:", error);
    }
  }

  async function executeCommand(command: string[]) {
    console.log("Executing command:", command);
    const result = await ExecuteCommand.create("bash", [
      "-c",
      command.join(" "),
    ]).execute();
    return result;
  }

  // ==================== Command Execution ====================
  async function runCommand() {
    const cmdArray = buildCommandArray();
    if (cmdArray.length === 0) {
      commandError.value = "请先选择子命令并填写参数";
      return;
    }

    builtCommand.value = cmdArray.join(" ");
    isExecuting.value = true;
    commandOutput.value = "";
    commandError.value = "";

    try {
      const result = await executeCommand(cmdArray);

      if (result.code === 0) {
        commandOutput.value = result.stdout || "命令执行成功（无输出）";
      } else {
        commandError.value =
          result.stderr || `命令执行失败（退出码: ${result.code}）`;
      }

      showResultDialog.value = true;
    } catch (error) {
      commandError.value = `执行错误: ${error}`;
      showResultDialog.value = true;
    } finally {
      isExecuting.value = false;
    }
  }

  async function copyCommand() {
    const cmdString = buildCommandString();
    if (!cmdString) return;

    try {
      await writeText(cmdString);
      isCopied.value = true;

      setTimeout(() => {
        isCopied.value = false;
      }, 2000);
    } catch (error) {
      console.error("复制失败:", error);
    }
  }

  // ==================== Lifecycle & Watchers ====================
  // ==================== Drag and Drop Functions ====================
  function registerDragTarget(paramName: string, element: HTMLElement) {
    dragTargets.set(paramName, element);
  }

  function unregisterDragTarget(paramName: string) {
    dragTargets.delete(paramName);
    delete dragState[paramName];
  }

  // ==================== Lifecycle & Watchers ====================
  watch(selectedSubcommand, () => {
    resetParamsToDefaults();
  });

  onMounted(async () => {
    initializeTheme();
    getCliqJson();

    // Setup drag and drop listener
    unlisten = await getCurrentWebview().onDragDropEvent((event) => {
      if (event.payload.type === "over") {
        const { x, y } = event.payload.position;

        // Reset all drag states
        Object.keys(dragState).forEach((key) => {
          dragState[key] = false;
        });

        // Use document.elementFromPoint to find the element under the cursor
        const elementAtPoint = document.elementFromPoint(x, y);

        if (elementAtPoint) {
          // Check which registered input contains this element
          dragTargets.forEach((element, paramName) => {
            if (
              element === elementAtPoint ||
              element.contains(elementAtPoint)
            ) {
              dragState[paramName] = true;
            }
          });
        }
      } else if (event.payload.type === "drop") {
        const { x, y } = event.payload.position;

        // Use document.elementFromPoint to find the element under the cursor
        const elementAtPoint = document.elementFromPoint(x, y);

        if (elementAtPoint) {
          // Find which registered input received the drop
          dragTargets.forEach((element, paramName) => {
            if (
              element === elementAtPoint ||
              element.contains(elementAtPoint)
            ) {
              const paths = (event.payload as any).paths;
              const filePath = paths?.[0] ?? "";
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

  // ==================== Return ====================
  return {
    // State
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
    // Computed
    currentCommand,
    cascadeOptions,
    requiredParams,
    optionalParams,
    commandPreview,
    // Functions
    toggleTheme,
    clearAllParams,
    resetParamsToDefaults,
    getCliqJson,
    buildCommandArray,
    buildCommandString,
    executeCommand,
    runCommand,
    copyCommand,
    // Drag and drop
    registerDragTarget,
    unregisterDragTarget,
    dragState,
  };
}
