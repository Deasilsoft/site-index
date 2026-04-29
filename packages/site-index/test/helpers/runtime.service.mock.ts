import { vi } from "vitest";

export function createRuntimeServiceMock() {
  const runtime = {
    buildArtifacts: vi.fn(),
    close: vi.fn(async () => {}),
  };

  const build = vi.fn(() => runtime);
  const withViteConfig = vi.fn(() => ({ build }));
  const withOptions = vi.fn(() => ({ withViteConfig }));
  const createRuntimeService = vi.fn(() => ({ withOptions }));

  return {
    createRuntimeService,
    runtime,
    withOptions,
    withViteConfig,
    reset() {
      runtime.buildArtifacts.mockReset();
      runtime.close.mockReset();
      build.mockClear();
      withViteConfig.mockClear();
      withOptions.mockClear();
      createRuntimeService.mockClear();
    },
  };
}
