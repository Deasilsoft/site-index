import type * as Vite from "vite";
import { vi } from "vitest";

export function createViteServerStub() {
  const watcherCallbacks = new Map<string, Set<(filePath: string) => void>>();
  const moduleNodesByUrl = new Map<string, Vite.EnvironmentModuleNode>();
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
    environments: {
      ssr: {
        moduleGraph: {
          getModuleByUrl: vi.fn(async (url: string) =>
            moduleNodesByUrl.get(url),
          ),
        },
      },
    },
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
    httpServer: {
      once: vi.fn((_event: string, callback: () => void) => {
        onClose = callback;
      }),
    },
  } as unknown as Vite.ViteDevServer;

  return {
    server,
    triggerWatcher: (event: string, filePath: string) => {
      for (const callback of watcherCallbacks.get(event) ?? []) {
        callback(filePath);
      }
    },
    setModuleByUrl: (url: string, node: Vite.EnvironmentModuleNode) => {
      moduleNodesByUrl.set(url, node);
    },
    close: () => {
      onClose?.();
    },
  };
}
