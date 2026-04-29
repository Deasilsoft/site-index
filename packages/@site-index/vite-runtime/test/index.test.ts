import { describe, expect, it } from "vitest";
import { createRuntimeService } from "../src/index.js";

describe("@site-index/vite-runtime contract", () => {
  it("exports createRuntimeService", () => {
    expect(typeof createRuntimeService).toBe("function");
  });

  it("builds a runtime service when options are provided", () => {
    const runtime = createRuntimeService()
      .withOptions({
        siteUrl: "https://example.com",
        extensions: [".ts", ".tsx"],
      })
      .build();

    expect(runtime.getArtifacts()).toEqual([]);
    expect(runtime.getWatchedFiles()).toEqual(new Set());
  });
});
