import { describe, it } from "vitest";
import { createModuleServiceHarness } from "./helpers/module-service.harness.js";

describe("ModuleService", () => {
  it("reuses cached modules for repeated import ids", async () => {
    const harness = createModuleServiceHarness();
    const { module } = harness.mockCacheableSuccess();

    await harness.loadTwice(module);

    harness.expectLookupAndLoadCounts(1, 1);
  });
});
