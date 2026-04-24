import { describe, expect, it } from "vitest";
import { siteIndexPlugin } from "../src/index.js";

describe("siteIndexPlugin", () => {
  it("returns serve + build plugins in stable order", () => {
    const plugins = siteIndexPlugin({ siteUrl: "https://example.com" });

    expect(plugins).toHaveLength(2);
    expect(plugins[0]?.apply).toBe("serve");
    expect(plugins[1]?.apply).toBe("build");
  });
});
