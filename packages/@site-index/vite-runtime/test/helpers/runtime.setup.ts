import type * as Vite from "vite";
import { createRuntimeService } from "../../src/index.js";

export function createAttachedRuntimeSetup(server: Vite.ViteDevServer) {
  const runtime = createRuntimeService()
    .withOptions({ siteUrl: "https://example.com" })
    .withViteServer(server)
    .build();

  return runtime;
}
