export type Warning = {
  message: string;
  filePath?: string;
};

export type Result<T> = {
  data: T;
  warnings: Warning[];
};
