// Types extracted from App.vue

export interface Arg {
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

export interface Flag {
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
  arg?: Arg;
  default?: string;
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
