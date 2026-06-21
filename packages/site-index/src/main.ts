import { cac } from "cac";
import pkg from "../package.json" with { type: "json" };
import { initMakeCommand } from "./domains/make/commands/make.command.js";
import { initBuildCommand } from "./domains/site-indexes/commands/build.command.js";
import { initCheckCommand } from "./domains/site-indexes/commands/check.command.js";
import { initRuntimeCommand } from "./domains/site-indexes/commands/runtime.command.js";
import { logger } from "./shared/logging/logger.js";

function hasCommandToken(argv: string[]): boolean {
  return argv.slice(2).some((argument) => !argument.startsWith("-"));
}

export async function main(argv: string[] = process.argv) {
  try {
    const cli = cac("site-index");

    cli.option("--quiet", "Suppress informational output");
    cli.option("--verbose", "Enable verbose logging");

    initBuildCommand(cli);
    initCheckCommand(cli);
    initRuntimeCommand(cli);
    initMakeCommand(cli);

    cli.help();
    cli.version(pkg.version);

    const parsed = cli.parse(argv, { run: false });

    logger.configure({
      quiet: Boolean(parsed.options.quiet),
      verbose: Boolean(parsed.options.verbose),
    });

    if (parsed.options.help || parsed.options.version) {
      return;
    }

    if (!hasCommandToken(argv)) {
      cli.outputHelp();

      return;
    }

    await cli.runMatchedCommand();
  } catch (error) {
    logger.error(error);

    process.exitCode = 1;
  }
}
