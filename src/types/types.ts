// Types extracted from App.vue

export interface Arg {
  name: string;
  usage: string;
  help?: string;
  help_long?: string;
  help_first_line?: string;
  required: boolean;
  double_dash?: string; // TODO: implement
  var?: boolean; // receive multiple values or not
  hide: boolean;
  default?: string;
  type?: Type; // only give if the arg is file or dir
}

export interface Flag {
  name: string;
  usage: string;
  help?: string;
  help_long?: string;
  help_first_line?: string;
  short: string[]; // short flag names
  long: string[]; // long flag names
  required?: boolean;
  double_dash?: string; // TODO: implement
  var?: boolean; // receive multiple values or not
  hide: boolean;
  global: boolean;
  arg?: Arg;
  default?: string;
  type?: Type; // only give if the flag is file or dir
}

export interface Command {
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

export interface CliqJson {
  name: string;
  bin: string;
  version?: string;
  description?: string;
  cmd: Command;
}

export interface CascadeOption {
  name: string;
  code: string;
  fullCmd: string[];
  command: Command;
  subcommands?: CascadeOption[];
}

export type Type = "file" | "dir";
