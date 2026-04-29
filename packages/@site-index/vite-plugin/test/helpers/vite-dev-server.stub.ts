import type { ViteDevServer } from "vite";
import { vi } from "vitest";

export function createViteDevServerStub(): ViteDevServer {
  return {
    config: {
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    },
    middlewares: {
      use: vi.fn(),
    },
  } as unknown as ViteDevServer;
}
