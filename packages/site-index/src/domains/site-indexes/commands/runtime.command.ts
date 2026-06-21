import type { CAC } from "cac";
import { RuntimeConfigSchema } from "../schemas/runtime.schema.js";
import { runRuntime } from "../runtime.service.js";

export function initRuntimeCommand(cli: CAC): void {
  cli
    .command("runtime", "Run a distributed site-index runtime artifact")
    .option("--site-url <url>", "Site URL used for absolute sitemap links")
    .option("--root <path>", "Project root")
    .option("--entry <path>", "Path to runtime artifact")
    .option("--out <dir>", "Output directory (relative to root)")
    .action(async (options) => {
      await runRuntime(RuntimeConfigSchema.parse(options));
    });
}
