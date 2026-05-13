import type { CAC } from "cac";
import { runCheck } from "../check.service.js";
import { CheckConfigSchema } from "../schemas/check.schema.js";

export function initCheckCommand(cli: CAC): void {
  cli
    .command("check", "Validate site-index modules for CI")
    .option("--site-url <url>", "Site URL used for absolute sitemap links")
    .option("--config <path>", "Path to Vite config")
    .option("--root <path>", "Project root")
    .action(async (options) => {
      await runCheck(CheckConfigSchema.parse(options));
    });
}
