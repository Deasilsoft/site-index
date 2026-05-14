import { describe, expect, it } from "vitest";
import {
  createRuntimeService,
  RuntimeService,
  RuntimeServiceBuilder,
} from "../src/index.js";

describe("@site-index/vite-runtime contract", () => {
  it("creates independent RuntimeServiceBuilder instances from factory calls", () => {
    const first = createRuntimeService();
    const second = createRuntimeService();

    expect(first).toBeInstanceOf(RuntimeServiceBuilder);
    expect(second).toBeInstanceOf(RuntimeServiceBuilder);
    expect(first).not.toBe(second);
  });

  it("builds a RuntimeService from factory + builder configuration", () => {
    const runtime = createRuntimeService()
      .withOptions({
        siteUrl: "https://example.com",
        extensions: [".ts", ".tsx"],
      })
      .withViteConfig({
        root: "/repo",
        mode: "test",
      })
      .build();

    expect(runtime).toBeInstanceOf(RuntimeService);
    expect(runtime.getArtifacts()).toEqual([]);
    expect(runtime.getWatchedFiles()).toEqual(new Set());
  });
});
