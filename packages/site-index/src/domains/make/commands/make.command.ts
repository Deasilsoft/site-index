import type { CAC } from "cac";
import { runMake } from "../make.service.js";
import { MakeConfigSchema } from "../schemas/make.schema.js";

export function initMakeCommand(cli: CAC): void {
  cli
    .command("make <filePath>", "Create a new site-index module")
    .option("--format <format>", "Module format (ts | esm)")
    .option("--force", "Overwrite if the file already exists")
    .action(async (filePath: string, options) => {
      await runMake(
        MakeConfigSchema.parse({
          filePath,
          format: options.format,
          force: options.force,
        }),
      );
    });
}
