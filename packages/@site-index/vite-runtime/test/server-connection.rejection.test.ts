import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRuntimeService } from "../src/index.js";

const hoisted = vi.hoisted(() => {
  const ssrLoadModule = vi.fn(async () => ({ default: { siteIndexes: [] } }));
  const moduleNode = {
    file: "/project/src/routes/a.site-index.ts",
    importedModules: new Set(),
  };
  const createServer = vi.fn(async () => ({
    config: { root: "/project" },
    environments: {
      ssr: {
        moduleGraph: {
          getModuleByUrl: vi.fn(async () => moduleNode),
        },
      },
    },
    ssrLoadModule,
    close: vi.fn(async () => {}),
  }));

  return {
    createServer,
  };
});

vi.mock("vite", () => ({
  createServer: hoisted.createServer,
}));

vi.mock("@site-index/core", () => ({
  main: vi.fn(),
}));

describe("RuntimeService Vite server rejection paths", () => {
  beforeEach(() => {
    hoisted.createServer.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when neither Vite config nor Vite server is provided", async () => {
    expect(() =>
      createRuntimeService()
        .withOptions({ siteUrl: "https://example.com" })
        .build(),
    ).toThrow(
      "Vite server or config must be provided to build the RuntimeService.",
    );
  });
});
