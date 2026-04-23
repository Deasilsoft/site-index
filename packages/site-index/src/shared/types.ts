export type Warning = {
  message: string;
  filePath?: string | undefined;
};

export type WithSource<T> = T & {
  filePath: string;
};

export type Result<T> = {
  data: T;
  warnings: Warning[];
};
