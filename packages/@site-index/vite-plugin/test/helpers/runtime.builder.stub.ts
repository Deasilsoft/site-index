import { vi } from "vitest";

export function createRuntimeBuilderStub<TRuntime>(runtime: TRuntime) {
  const build = vi.fn(() => runtime);
  const withOptions = vi.fn(() => ({ build }));

  return {
    builder: { withOptions },
    build,
    withOptions,
  };
}
