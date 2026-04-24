import { vi } from "vitest";
import type { ViteDevServer } from "vite";
import type { RequestHandler } from "./http.stub.js";

export function createViteServerStub() {
  const watcherCallbacks = new Map<string, Set<(filePath: string) => void>>();
  let middleware: RequestHandler | undefined;
  let onClose: (() => void) | undefined;

  const server = {
    config: {
      root: "/repo",
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    },
    ssrLoadModule: vi.fn(async () => ({ default: { siteIndexes: [] } })),
    watcher: {
      on: vi.fn((event: string, callback: (filePath: string) => void) => {
        const callbacks =
          watcherCallbacks.get(event) ?? new Set<(filePath: string) => void>();
        callbacks.add(callback);
        watcherCallbacks.set(event, callbacks);
      }),
      off: vi.fn((event: string, callback: (filePath: string) => void) => {
        watcherCallbacks.get(event)?.delete(callback);
      }),
    },
    middlewares: {
      use: vi.fn((handler: RequestHandler) => {
        middleware = handler;
      }),
    },
    httpServer: {
      once: vi.fn((_event: string, callback: () => void) => {
        onClose = callback;
      }),
    },
  } as unknown as ViteDevServer;

  return {
    server,
    getMiddleware: () => middleware,
    triggerWatcher: (event: string, filePath: string) => {
      for (const callback of watcherCallbacks.get(event) ?? []) {
        callback(filePath);
      }
    },
    close: () => {
      onClose?.();
    },
  };
}
