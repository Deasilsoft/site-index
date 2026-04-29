import type * as Vite from "vite";
import { createRuntimeService } from "../../src/index.js";

export function createAttachedRuntimeSetup(server: Vite.ViteDevServer) {
  const runtime = createRuntimeService()
    .withOptions({ siteUrl: "https://example.com" })
    .build();

  runtime.attachViteServer(server);

  return runtime;
}
