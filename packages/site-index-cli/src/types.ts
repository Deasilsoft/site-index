export type PackageJsonWithVersion = {
  version?: unknown;
};

export type BuildCommandOptions = {
  root: string;
  siteUrl: string;
  config?: string | undefined;
  mode?: string | undefined;
  outDir: string;
};

export type BuildCommandCliOptions = {
  root: string;
  siteUrl?: string;
  config?: string;
  mode?: string;
  outDir: string;
};

export type CheckCommandOptions = {
  root: string;
  siteUrl: string;
  config?: string | undefined;
  mode?: string | undefined;
};

export type CheckCommandCliOptions = {
  root: string;
  siteUrl?: string;
  config?: string;
  mode?: string;
};

export type MakeOptions = {
  name: string;
  dir?: string;
  force?: boolean;
};

export type MakeCommandCliOptions = {
  dir: string;
  force: boolean;
};

export type MakeResult = {
  filePath: string;
};

export type PlopFailure = {
  error?: unknown;
};

export type LogMethod = (...args: unknown[]) => void;

export type Logger = {
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
};
