import { describe, expect, it } from "vitest";
import { siteIndexPlugin } from "../../src/index.js";

describe("siteIndexPlugin", () => {
  it("is defined", () => {
    expect(siteIndexPlugin).toBeTypeOf("function");
  });
});
