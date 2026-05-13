import { describe, it } from "vitest";
import { createModuleLoaderSetup } from "./helpers/module-loader.setup.js";

describe("ModuleLoader", () => {
  it("reuses cached modules for repeated import ids", async () => {
    const setup = createModuleLoaderSetup();
    const { module } = setup.mockCacheableSuccess();

    await setup.loadTwice(module);

    setup.expectLookupAndLoadCounts(1, 1);
  });
});
