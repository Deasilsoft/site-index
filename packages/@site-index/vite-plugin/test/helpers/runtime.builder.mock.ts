import { vi } from "vitest";

export function createRuntimeBuilderMock<TRuntime>(runtime: TRuntime) {
  const build = vi.fn(() => runtime);
  const withViteConfig = vi.fn(() => ({ build }));
  const withViteServer = vi.fn(() => ({ build }));
  const withOptions = vi.fn(() => ({ withViteConfig, withViteServer, build }));

  return {
    builder: { withOptions },
    build,
    withViteConfig,
    withViteServer,
    withOptions,
  };
}
