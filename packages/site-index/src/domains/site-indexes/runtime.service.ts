import { pathToFileURL } from "node:url";
import type { RuntimeConfig } from "./types.js";

type RuntimeModule = {
  run?: (args: string[]) => Promise<unknown>;
};

export async function runRuntime(config: RuntimeConfig): Promise<void> {
  const modulePath = pathToFileURL(config.entryPath).href;
  const runtimeModule = (await import(modulePath)) as RuntimeModule;

  if (typeof runtimeModule.run !== "function") {
    throw new TypeError(
      `Invalid runtime module "${config.entryPath}": expected export 'run(args)'`,
    );
  }

  await runtimeModule.run(["--site-url", config.siteUrl, "--out", config.outPath]);
}
