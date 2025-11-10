<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { invoke } from "@tauri-apps/api/core";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import CascadeSelect from "primevue/cascadeselect";
import ToggleSwitch from "primevue/toggleswitch";
import Dialog from "primevue/dialog";
import { Command as ExecuteCommand } from "@tauri-apps/plugin-shell";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

interface Arg {
  name: string;
  usage: string;
  help?: string;
  help_long?: string;
  help_first_line?: string;
  required: boolean;
  double_dash?: string; // unnecessary
  var?: boolean; // receive multiple values or not
  hide: boolean;
  default?: string;
}

interface Flag {
  name: string;
  usage: string;
  help?: string;
  help_long?: string;
  help_first_line?: string;
  short: string[]; // short flag names
  long: string[]; // long flag names
  required?: boolean;
  double_dash?: string; // unnecessary
  var?: boolean; // receive multiple values or not
  hide: boolean;
  global: boolean;
  arg?: Arg; // often unnecessary
  default?: string;
}

interface Command {
  full_cmd: string[];
  usage: string;
  subcommands: Record<string, Command>;
  args: Arg[];
  flags: Flag[];
  mounts: unknown[];
  hide: boolean;
  help?: string;
  help_long?: string;
  name: string;
  aliases: string[];
  hidden_aliases: string[];
  examples: unknown[];
  subcommand_required?: boolean;
}

interface CliqJson {
  name: string;
  bin: string;
  version?: string;
  description?: string;
  cmd: Command;
}

interface CascadeOption {
  name: string;
  code: string;
  fullCmd: string[];
  command: Command;
  subcommands?: CascadeOption[];
}

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

// 检查系统主题偏好
function checkSystemTheme() {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    isDark.value = true;
    document.documentElement.classList.add("dark");
  }
}

// 切换主题
function toggleTheme() {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

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

// 构建命令数组
function buildCommandArray(): string[] {
  if (!cliqJson.value || !selectedSubcommand.value) return [];

  const parts: string[] = [];

  // 1. 添加 bin 名称
  parts.push(cliqJson.value.bin);

  // 2. 添加子命令路径
  parts.push(...selectedSubcommand.value.fullCmd);

  // 3. 添加 flags（带参数的）
  currentCommand.value?.flags.forEach((flag: Flag) => {
    if (flag.arg) {
      // 带参数的 flag
      const value = commandValues.value[flag.name];
      if (value) {
        const flagName =
          flag.long.length > 0 ? `--${flag.long[0]}` : `-${flag.short[0]}`;
        parts.push(flagName, value);
      }
    } else {
      // 布尔 flag
      const isEnabled = booleanFlags.value[flag.name];
      if (isEnabled) {
        const flagName =
          flag.long.length > 0 ? `--${flag.long[0]}` : `-${flag.short[0]}`;
        parts.push(flagName);
      }
    }
  });

  // 4. 添加 arguments
  currentCommand.value?.args.forEach((arg: Arg) => {
    const value = commandValues.value[arg.name];
    if (value) {
      parts.push(value);
    }
  });

  return parts;
}

// 构建命令字符串（用于预览和复制）
function buildCommandString(): string {
  return buildCommandArray().join(" ");
}

// 执行命令
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

    // 打开结果对话框
    showResultDialog.value = true;
  } catch (error) {
    commandError.value = `执行错误: ${error}`;
    showResultDialog.value = true;
  } finally {
    isExecuting.value = false;
  }
}

// 复制命令到剪贴板
async function copyCommand() {
  const cmdString = buildCommandString();
  if (!cmdString) {
    return;
  }

  try {
    await writeText(cmdString);
    isCopied.value = true;

    // 2秒后重置状态
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (error) {
    console.error("复制失败:", error);
  }
}

// 实时更新命令预览
const commandPreview = computed(() => {
  return buildCommandString() || "请选择子命令并填写参数";
});

const cascadeOptions = computed(() => {
  if (!cliqJson.value?.cmd.subcommands) return [];

  const buildOptions = (
    subcommands: Record<string, Command>,
    parentPath: string[] = [],
  ): CascadeOption[] => {
    return Object.entries(subcommands)
      .filter(([_, cmd]) => !cmd.hide)
      .map(([key, cmd]) => {
        const option: CascadeOption = {
          name: cmd.name,
          code: [...parentPath, key].join("."),
          fullCmd: cmd.full_cmd,
          command: cmd,
        };

        if (Object.keys(cmd.subcommands).length > 0) {
          option.subcommands = buildOptions(cmd.subcommands, [
            ...parentPath,
            key,
          ]);
        }

        return option;
      });
  };

  return buildOptions(cliqJson.value.cmd.subcommands);
});

const currentCommand = computed(() => {
  if (!selectedSubcommand.value) return null;
  return selectedSubcommand.value.command;
});

const requiredParams = computed(() => {
  if (!currentCommand.value) return { args: [], flags: [] };

  const args = currentCommand.value.args.filter(
    (arg: Arg) => arg.required && !arg.hide,
  );
  const flags = currentCommand.value.flags.filter(
    (flag: Flag) => flag.required && !flag.hide,
  );

  return { args, flags };
});

const optionalParams = computed(() => {
  if (!currentCommand.value) return { args: [], flags: [] };

  const args = currentCommand.value.args.filter(
    (arg: Arg) => !arg.required && !arg.hide,
  );
  const flags = currentCommand.value.flags.filter(
    (flag: Flag) => !flag.required && !flag.hide,
  );

  return { args, flags };
});

watch(selectedSubcommand, () => {
  commandValues.value = {};
  booleanFlags.value = {};
  if (selectedSubcommand.value) {
    const cmd = selectedSubcommand.value.command;
    cmd.flags.forEach((flag: Flag) => {
      if (!flag.arg) {
        booleanFlags.value[flag.name] =
          flag.default !== undefined ? flag.default === "true" : false; // Use default value if available, otherwise false
      }
    });
  }
});

onMounted(() => {
  checkSystemTheme();
  getCliqJson();
});
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] transition-colors duration-200"
  >
    <!-- 顶部栏 -->
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
            @click="toggleTheme"
            class="hover:bg-gray-100 dark:hover:bg-gray-800"
          />
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 描述信息 -->
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

      <!-- 主内容区域 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 左侧：子命令选择器 -->
        <div class="lg:col-span-1">
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
                v-model="selectedSubcommand"
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
        </div>

        <!-- 右侧：参数区域 -->
        <div class="lg:col-span-2">
          <div v-if="currentCommand" class="space-y-4">
            <!-- 必填参数 -->
            <div
              v-if="
                requiredParams.args.length > 0 ||
                requiredParams.flags.length > 0
              "
              class="bg-white dark:bg-[#0A0A0B] rounded-lg overflow-hidden border border-gray-200 dark:border-white/10"
            >
              <div
                class="px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-white/10"
              >
                <h3
                  class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2"
                >
                  <!-- <i class="pi pi-star-fill text-red-500 text-xs"></i> -->
                  Required Parameters
                </h3>
              </div>

              <div class="p-4 space-y-4">
                <!-- Arguments -->
                <div v-for="arg in requiredParams.args" :key="arg.name">
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <label
                      class="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {{ arg.name }}
                      <span class="text-red-500">*</span>
                    </label>
                    <p
                      v-if="arg.help || arg.help_first_line"
                      class="text-xs text-gray-500 dark:text-gray-400 flex-1 text-right"
                    >
                      {{ arg.help || arg.help_first_line }}
                    </p>
                  </div>
                  <InputText
                    v-model="commandValues[arg.name]"
                    :placeholder="arg.usage"
                    class="w-full"
                  />
                </div>

                <!-- Flags -->
                <div v-for="flag in requiredParams.flags" :key="flag.name">
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <label
                      class="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {{ flag.name }}
                      <span class="text-red-500">*</span>
                    </label>
                    <p
                      v-if="flag.help_long || flag.help || flag.help_first_line"
                      class="text-xs text-gray-500 dark:text-gray-400 flex-1 text-right"
                    >
                      {{ flag.help_long || flag.help || flag.help_first_line }}
                    </p>
                  </div>

                  <div
                    v-if="!flag.arg"
                    class="flex items-center gap-3 p-2 bg-gray-50 dark:bg-[#1a1a1a] rounded border border-gray-200 dark:border-white/10"
                  >
                    <ToggleSwitch v-model="booleanFlags[flag.name]" />
                    <span
                      class="text-sm text-gray-600 dark:text-gray-400 font-mono"
                      >{{ flag.usage }}</span
                    >
                  </div>

                  <InputText
                    v-else
                    v-model="commandValues[flag.name]"
                    :placeholder="flag.arg.usage"
                    class="w-full"
                  />
                </div>
              </div>
            </div>

            <!-- 可选参数 -->
            <div
              v-if="
                optionalParams.args.length > 0 ||
                optionalParams.flags.length > 0
              "
              class="bg-white dark:bg-[#0A0A0B] rounded-lg overflow-hidden border border-gray-200 dark:border-white/10"
            >
              <div
                class="px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-white/10"
              >
                <h3
                  class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2"
                >
                  <!-- <i class="pi pi-sliders-h text-gray-500 text-xs"></i> -->
                  Optional Parameters
                </h3>
              </div>

              <div class="p-4 space-y-4">
                <!-- Arguments -->
                <div v-for="arg in optionalParams.args" :key="arg.name">
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <label
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {{ arg.name }}
                    </label>
                    <p
                      v-if="arg.help || arg.help_first_line"
                      class="text-xs text-gray-500 dark:text-gray-400 flex-1 text-right"
                    >
                      {{ arg.help || arg.help_first_line }}
                    </p>
                  </div>
                  <InputText
                    v-model="commandValues[arg.name]"
                    :placeholder="arg.usage"
                    class="w-full"
                  />
                </div>

                <!-- Flags -->
                <div v-for="flag in optionalParams.flags" :key="flag.name">
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <label
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {{ flag.name }}
                    </label>
                    <p
                      v-if="flag.help_long || flag.help || flag.help_first_line"
                      class="text-xs text-gray-500 dark:text-gray-400 flex-1 text-right"
                    >
                      {{ flag.help_long || flag.help || flag.help_first_line }}
                    </p>
                  </div>

                  <div
                    v-if="!flag.arg"
                    class="flex items-center gap-3 p-2 bg-gray-50 dark:bg-[#1a1a1a] rounded border border-gray-200 dark:border-white/10"
                  >
                    <ToggleSwitch v-model="booleanFlags[flag.name]" />
                    <span
                      class="text-sm text-gray-600 dark:text-gray-400 font-mono"
                      >{{ flag.usage }}</span
                    >
                  </div>

                  <InputText
                    v-else
                    v-model="commandValues[flag.name]"
                    :placeholder="flag.arg?.usage"
                    class="w-full"
                  />
                </div>
              </div>
            </div>

            <!-- 命令预览 -->
            <div
              class="bg-white dark:bg-[#0A0A0B] rounded-lg overflow-hidden border border-gray-200 dark:border-white/10"
            >
              <div
                class="px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-white/10"
              >
                <h3
                  class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2"
                >
                  <i class="pi pi-terminal text-green-500 text-xs"></i>
                  Command Preview
                </h3>
              </div>
              <div class="p-4">
                <div
                  class="bg-gray-100 dark:bg-[#0A0A0B] rounded p-3 font-mono text-xs text-gray-800 dark:text-[#10b981] break-all border border-gray-200 dark:border-white/10"
                >
                  <span class="text-gray-500 dark:text-gray-600 mr-2">$</span
                  >{{ commandPreview }}
                </div>
              </div>
            </div>

            <!-- 执行按钮 -->
            <div
              class="bg-white dark:bg-[#0f0f0f] rounded-lg overflow-hidden border border-gray-200 dark:border-white/10"
            >
              <div class="grid grid-cols-2 gap-0">
                <button
                  @click="runCommand"
                  :disabled="isExecuting"
                  class="bg-[#10b981] hover:bg-[#059669] active:bg-[#047857] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 transition-all duration-200 flex items-center justify-center gap-3 group border-r border-white/10"
                >
                  <svg
                    v-if="!isExecuting"
                    class="w-5 h-5 group-hover:scale-110 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <svg
                    v-else
                    class="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span class="text-base">{{
                    isExecuting ? "Executing..." : "Execute"
                  }}</span>
                </button>

                <button
                  @click="copyCommand"
                  class="bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white font-semibold py-3 px-6 transition-all duration-200 flex items-center justify-center gap-3 group"
                >
                  <svg
                    v-if="!isCopied"
                    class="w-5 h-5 group-hover:scale-110 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <svg
                    v-else
                    class="w-5 h-5 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span class="text-base">{{
                    isCopied ? "Copied!" : "Copy"
                  }}</span>
                </button>
              </div>
            </div>
          </div>

          <div
            v-else-if="!selectedSubcommand && cliqJson"
            class="bg-white dark:bg-[#0f0f0f] rounded-lg border border-gray-200 dark:border-white/10 p-12 text-center"
          >
            <i
              class="pi pi-code text-6xl text-gray-300 dark:text-gray-700 mb-4"
            ></i>
            <p class="text-gray-500 dark:text-gray-500">
              Select a subcommand to begin
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 执行结果 Dialog -->
    <Dialog
      v-model:visible="showResultDialog"
      modal
      :header="commandOutput ? 'Execution Success' : 'Execution Error'"
      :style="{ width: '50rem' }"
      :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    >
      <div class="space-y-4">
        <!-- 执行的命令 -->
        <div>
          <h4
            class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
          >
            Command:
          </h4>
          <div
            class="bg-gray-100 dark:bg-black/40 rounded p-3 font-mono text-xs text-gray-800 dark:text-green-400 break-all border border-gray-200 dark:border-gray-800"
          >
            <span class="text-gray-500 dark:text-gray-600 mr-2">$</span
            >{{ builtCommand }}
          </div>
        </div>

        <!-- 成功输出 -->
        <div v-if="commandOutput">
          <h4
            class="text-sm font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2"
          >
            <i
              class="pi pi-check-circle text-green-600 dark:text-green-400"
            ></i>
            Output:
          </h4>
          <div
            class="bg-green-50 dark:bg-green-950/20 border border-green-300 dark:border-green-900 rounded p-4 max-h-96 overflow-auto"
          >
            <pre
              class="text-xs text-green-700 dark:text-green-400 whitespace-pre-wrap break-all font-mono"
              >{{ commandOutput }}</pre
            >
          </div>
        </div>

        <!-- 错误输出 -->
        <div v-if="commandError">
          <h4
            class="text-sm font-semibold text-red-700 dark:text-red-300 mb-2 flex items-center gap-2"
          >
            <i class="pi pi-times-circle text-red-600 dark:text-red-400"></i>
            Error:
          </h4>
          <div
            class="bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-900 rounded p-4 max-h-96 overflow-auto"
          >
            <pre
              class="text-xs text-red-700 dark:text-red-400 whitespace-pre-wrap break-all font-mono"
              >{{ commandError }}</pre
            >
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped></style>
