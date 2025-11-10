// Utility functions extracted from App.vue
import type { Arg, Flag, Command, CascadeOption } from "../types/types";

/**
 * Parses a default string value into a boolean.
 * @param val - The string value to parse.
 * @returns A boolean representation of the string.
 */
export function parseDefaultBool(val?: string): boolean {
  if (typeof val === "undefined" || val === null) return false;
  const s = String(val).toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y" || s === "on";
}

/**
 * Checks if the system prefers dark theme.
 * @returns true if dark theme is preferred, false otherwise.
 */
export function checkSystemDarkTheme(): boolean {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return true;
  }
  return false;
}

/**
 * Applies or removes dark theme class on document.
 * @param isDark - Whether to apply dark theme.
 */
export function applyTheme(isDark: boolean): void {
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

/**
 * Gets the flag name (long or short) for CLI command.
 * @param flag - The flag object.
 * @returns The formatted flag name (e.g., "--verbose" or "-v").
 */
export function getFlagName(flag: Flag): string {
  return flag.long.length > 0 ? `--${flag.long[0]}` : `-${flag.short[0]}`;
}

/**
 * Builds cascade options from command subcommands.
 * @param subcommands - Record of subcommands.
 * @param parentPath - Parent path array for nested commands.
 * @returns Array of cascade options.
 */
export function buildCascadeOptions(
  subcommands: Record<string, Command>,
  parentPath: string[] = [],
): CascadeOption[] {
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
        option.subcommands = buildCascadeOptions(cmd.subcommands, [
          ...parentPath,
          key,
        ]);
      }

      return option;
    });
}

/**
 * Filters parameters by required and visibility.
 * @param args - Array of arguments.
 * @param flags - Array of flags.
 * @param required - Whether to filter for required parameters.
 * @returns Filtered args and flags.
 */
export function filterParams(
  args: Arg[],
  flags: Flag[],
  required: boolean,
): { args: Arg[]; flags: Flag[] } {
  return {
    args: args
      .filter((arg: Arg) => (required ? arg.required === true : !arg.required))
      .filter((arg: Arg) => !arg.hide),
    flags: flags
      .filter((flag: Flag) =>
        required ? flag.required === true : !flag.required,
      )
      .filter((flag: Flag) => !flag.hide),
  };
}

/**
 * Builds command array from parameters.
 * @param bin - Binary name.
 * @param fullCmd - Full command path.
 * @param flags - Array of flags.
 * @param args - Array of arguments.
 * @param commandValues - Record of command values.
 * @param booleanFlags - Record of boolean flag values.
 * @returns Array of command parts.
 */
export function buildCommandArray(
  bin: string,
  fullCmd: string[],
  flags: Flag[],
  args: Arg[],
  commandValues: Record<string, string>,
  booleanFlags: Record<string, boolean>,
): string[] {
  const parts: string[] = [];

  // 1. Add bin name
  parts.push(bin);

  // 2. Add subcommand path
  parts.push(...fullCmd);

  // 3. Add flags
  flags.forEach((flag: Flag) => {
    if (flag.arg) {
      // Flag with argument
      const value =
        commandValues[flag.name] ?? flag.default ?? flag.arg?.default ?? "";
      if (value) {
        parts.push(getFlagName(flag), value);
      }
    } else {
      // Boolean flag
      let isEnabled: boolean;
      if (Object.prototype.hasOwnProperty.call(booleanFlags, flag.name)) {
        isEnabled = booleanFlags[flag.name];
      } else if (typeof flag.default !== "undefined") {
        isEnabled = parseDefaultBool(flag.default);
      } else {
        isEnabled = false;
      }

      if (isEnabled) {
        parts.push(getFlagName(flag));
      }
    }
  });

  // 4. Add arguments
  args.forEach((arg: Arg) => {
    const value = commandValues[arg.name] ?? arg.default ?? "";
    if (value) {
      parts.push(value);
    }
  });

  return parts;
}
