export type Warning = {
  message: string;
  filePath?: string | undefined;
};

export type Result<T> = {
  data: T;
  warnings: Warning[];
};
