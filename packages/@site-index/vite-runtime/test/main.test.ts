import { describe, expect, it } from "vitest";
import { makeViteSiteIndexService } from "../src/index.js";

describe("@site-index/vite-runtime exports", () => {
  it("exports makeViteSiteIndexService", () => {
    expect(typeof makeViteSiteIndexService).toBe("function");
  });
});
