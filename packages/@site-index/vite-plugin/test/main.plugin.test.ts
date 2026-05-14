import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => {
  const buildPlugin = { name: "build-plugin" };
  const servePlugin = { name: "serve-plugin" };

  return {
    buildPlugin,
    servePlugin,
    siteIndexBuildPluginMock: vi.fn(() => buildPlugin),
    siteIndexServePluginMock: vi.fn(() => servePlugin),
  };
});

vi.mock("../src/domains/build/build.plugin.js", () => ({
  siteIndexBuildPlugin: hoisted.siteIndexBuildPluginMock,
}));

vi.mock("../src/domains/serve/serve.plugin.js", () => ({
  siteIndexServePlugin: hoisted.siteIndexServePluginMock,
}));

import { siteIndexPlugin } from "../src/index.js";

describe("siteIndexPlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns serve first, build second, and passes options to both plugins", () => {
    const options = {
      siteUrl: "https://example.com",
      extensions: [".site-index.ts", ".mdx"],
    };

    const plugins = siteIndexPlugin(options);

    expect(plugins).toStrictEqual([hoisted.servePlugin, hoisted.buildPlugin]);
    expect(hoisted.siteIndexServePluginMock).toHaveBeenNthCalledWith(
      1,
      options,
    );
    expect(hoisted.siteIndexBuildPluginMock).toHaveBeenNthCalledWith(
      1,
      options,
    );
  });
});
