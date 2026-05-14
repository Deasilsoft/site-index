import { describe, expect, it } from "vitest";
import { Artifact } from "../../../src/index.js";

describe("Artifact", () => {
  it("creates immutable .txt artifact and derives content type", () => {
    const artifact = new Artifact({
      filePath: "robots.txt",
      content: "User-agent: *",
    });

    expect(artifact.filePath).toBe("robots.txt");
    expect(artifact.content).toBe("User-agent: *");
    expect(artifact.contentType).toBe("text/plain; charset=utf-8");
    expect(Object.isFrozen(artifact)).toBe(true);
  });

  it("creates .xml artifact and derives content type", () => {
    const artifact = new Artifact({
      filePath: "sitemap.xml",
      content: "<xml />",
    });

    expect(artifact.contentType).toBe("application/xml; charset=utf-8");
  });

  it("rejects unsupported extension", () => {
    expect(
      () =>
        new Artifact({
          filePath: "index.html",
          content: "x",
        }),
    ).toThrow("Unsupported artifact file extension");
  });
});
