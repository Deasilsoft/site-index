import * as SiteIndex from "@site-index/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAttachedRuntimeSetup } from "./helpers/runtime.setup.js";
import { createViteServerMock } from "./helpers/vite-server.mock.js";

vi.mock("@site-index/core", () => ({
  main: vi.fn(),
}));

describe("RuntimeService rebuild stress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("serializes concurrent buildArtifacts calls and keeps the queue healthy after failures", async () => {
    const failingBuildNumbers = new Set([2, 5, 8]);
    let activeBuilds = 0;
    let maxActiveBuilds = 0;
    let buildNumber = 0;

    vi.mocked(SiteIndex.main).mockImplementation(async () => {
      const currentBuildNumber = ++buildNumber;

      activeBuilds += 1;
      maxActiveBuilds = Math.max(maxActiveBuilds, activeBuilds);

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 5);
      });

      try {
        if (failingBuildNumbers.has(currentBuildNumber)) {
          throw new Error(`build failed ${currentBuildNumber}`);
        }

        return {
          data: [
            {
              filePath: `sitemap-${currentBuildNumber}.xml`,
              content: `XML_${currentBuildNumber}`,
              contentType: "application/xml; charset=utf-8",
            },
          ],
          warnings: [],
        };
      } finally {
        activeBuilds -= 1;
      }
    });

    const runtime = createAttachedRuntimeSetup(createViteServerMock().server);

    const burstSize = 12;
    const burst = Array.from({ length: burstSize }, () =>
      runtime.buildArtifacts(),
    );
    const settled = await Promise.allSettled(burst);

    expect(maxActiveBuilds).toBe(1);

    const fulfilled = settled.filter((result) => result.status === "fulfilled");
    const rejected = settled.filter((result) => result.status === "rejected");

    expect(rejected).toHaveLength(failingBuildNumbers.size);

    for (const result of rejected) {
      if (result.status === "rejected") {
        expect(result.reason).toBeInstanceOf(Error);
      }
    }

    for (const result of fulfilled) {
      if (result.status === "fulfilled") {
        expect(result.value.data).toHaveLength(1);
        expect(result.value.data[0]?.filePath).toMatch(/^sitemap-\d+\.xml$/);
        expect(result.value.data[0]?.content).toMatch(/^XML_\d+$/);
      }
    }

    await expect(runtime.buildArtifacts()).resolves.toEqual({
      data: [
        {
          filePath: "sitemap-13.xml",
          content: "XML_13",
          contentType: "application/xml; charset=utf-8",
        },
      ],
      warnings: [],
    });

    expect(runtime.getArtifacts()).toEqual([
      {
        filePath: "sitemap-13.xml",
        content: "XML_13",
        contentType: "application/xml; charset=utf-8",
      },
    ]);
    expect(SiteIndex.main).toHaveBeenCalledTimes(13);
    expect(maxActiveBuilds).toBe(1);
  });
});
