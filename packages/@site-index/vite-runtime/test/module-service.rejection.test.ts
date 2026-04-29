import { describe, expect, it } from "vitest";
import { createModuleServiceSetup } from "./helpers/module-service.setup.js";

describe("ModuleService rejections", () => {
  it("throws when module graph lookup is unresolved and retries on the next load", async () => {
    const setup = createModuleServiceSetup();
    const { module, moduleExports } = setup.mockUnresolvedThenResolved();

    await expect(setup.loadOnce(module)).rejects.toThrow(
      'Unable to resolve loaded module "./src/routes/a.site-index.ts"',
    );

    await expect(setup.loadOnce(module)).resolves.toEqual(moduleExports);
    setup.expectLookupAndLoadCounts(2, 2);
  });
});
