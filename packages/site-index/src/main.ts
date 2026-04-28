import { cac } from "cac";
import pkg from "../package.json" with { type: "json" };
import { initMakeCommand } from "./domains/make/commands/make.command.js";
import { initBuildCommand } from "./domains/site-indexes/commands/build.command.js";
import { initCheckCommand } from "./domains/site-indexes/commands/check.command.js";
import { logger } from "./shared/services/logger.service.js";

export async function main(argv: string[] = process.argv) {
  logger.configure({
    quiet: argv.includes("--quiet"),
    verbose: argv.includes("--verbose"),
  });

  try {
    const cli = cac("site-index");

    cli.option("--quiet", "Suppress informational output");
    cli.option("--verbose", "Enable verbose logging");

    initBuildCommand(cli);
    initCheckCommand(cli);
    initMakeCommand(cli);

    cli.help();
    cli.version(pkg.version);

    cli.parse(argv, { run: false });

    if (argv.length <= 2) {
      cli.outputHelp();
    } else {
      await cli.runMatchedCommand();
    }
  } catch (error) {
    logger.error(error);

    process.exitCode = 1;
  }
}
