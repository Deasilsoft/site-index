import { describe, expect, it } from "vitest";
import { createModuleServiceHarness } from "./helpers/module-service.harness.js";

describe("ModuleService rejections", () => {
  it("throws when module graph lookup is unresolved and retries on the next load", async () => {
    const harness = createModuleServiceHarness();
    const { module, moduleExports } = harness.mockUnresolvedThenResolved();

    await expect(harness.loadOnce(module)).rejects.toThrow(
      'Unable to resolve loaded module "./src/routes/a.site-index.ts"',
    );

    await expect(harness.loadOnce(module)).resolves.toEqual(moduleExports);
    harness.expectLookupAndLoadCounts(2, 2);
  });
});
