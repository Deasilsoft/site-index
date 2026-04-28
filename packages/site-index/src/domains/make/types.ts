export const FORMATS = ["ts", "esm"] as const;

export type Format = (typeof FORMATS)[number];

export type MakeConfig = {
  filePath: string;
  format: Format;
  force: boolean;
  outputFilePath: string;
};

export type ScaffoldFailure = {
  path: string;
  error: string;
  message: string;
};
