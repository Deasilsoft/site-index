import { describe, it } from "vitest";
import { createModuleServiceSetup } from "./helpers/module-service.setup.js";

describe("ModuleService", () => {
  it("reuses cached modules for repeated import ids", async () => {
    const setup = createModuleServiceSetup();
    const { module } = setup.mockCacheableSuccess();

    await setup.loadTwice(module);

    setup.expectLookupAndLoadCounts(1, 1);
  });
});
