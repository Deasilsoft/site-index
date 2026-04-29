import { describe, expect, it } from "vitest";
import { createRuntimeService } from "../src/index.js";

describe("@site-index/vite-runtime contract rejections", () => {
  it("throws when build is called without options", () => {
    expect(() => createRuntimeService().build()).toThrow(
      "Options must be provided to build the RuntimeService.",
    );
  });
});
