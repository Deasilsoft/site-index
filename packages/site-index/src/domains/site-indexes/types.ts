export type BaseConfig = {
  siteUrl: string;
  rootPath: string;
  configFile?: string;
};

export type BuildConfig = BaseConfig & {
  outPath: string;
};

export type CheckConfig = BaseConfig;

export type RuntimeConfig = {
  siteUrl: string;
  rootPath: string;
  outPath: string;
  entryPath: string;
};
