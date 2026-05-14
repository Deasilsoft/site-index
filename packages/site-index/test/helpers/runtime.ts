import { vi } from "vitest";

function createRuntimeMocks() {
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

const runtimeMocks = vi.hoisted(() => createRuntimeMocks());

export function getRuntimeMocks() {
  return runtimeMocks;
}

vi.mock("@site-index/vite-runtime", () => ({
  createRuntimeService: runtimeMocks.createRuntimeService,
}));
