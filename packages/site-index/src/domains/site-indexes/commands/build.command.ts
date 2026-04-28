import type { CAC } from "cac";
import { runBuild } from "../build.service.js";
import { BuildConfigSchema } from "../schemas/build.schema.js";

export function initBuildCommand(cli: CAC): void {
  cli
    .command("build", "Generate site-index artifacts")
    .option("--site-url <url>", "Site URL used for absolute sitemap links")
    .option("--root <path>", "Project root")
    .option("--out <dir>", "Output directory (relative to root)")
    .option("--config <path>", "Path to Vite config")
    .action(async (options) => {
      await runBuild(BuildConfigSchema.parse(options));
    });
}
