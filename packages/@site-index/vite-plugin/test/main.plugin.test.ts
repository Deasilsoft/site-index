import { beforeEach, describe, expect, it, vi } from "vitest";

const buildPlugin = { name: "build-plugin" };
const servePlugin = { name: "serve-plugin" };

const siteIndexBuildPluginMock = vi.hoisted(() => vi.fn(() => buildPlugin));
const siteIndexServePluginMock = vi.hoisted(() => vi.fn(() => servePlugin));

vi.mock("../src/domains/build/build.plugin.js", () => ({
  siteIndexBuildPlugin: siteIndexBuildPluginMock,
}));

vi.mock("../src/domains/serve/serve.plugin.js", () => ({
  siteIndexServePlugin: siteIndexServePluginMock,
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

    expect(plugins).toStrictEqual([servePlugin, buildPlugin]);
    expect(siteIndexServePluginMock).toHaveBeenNthCalledWith(1, options);
    expect(siteIndexBuildPluginMock).toHaveBeenNthCalledWith(1, options);
  });
});

