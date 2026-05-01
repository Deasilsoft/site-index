import type * as Vite from "vite";

export type ServerConnection = {
  getServer(): Promise<Vite.ViteDevServer>;
  getRootPath(): string;
  close(): Promise<void>;
};
