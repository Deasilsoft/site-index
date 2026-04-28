import { z as Zod } from "zod";
import type { ModuleLoader, Options } from "./types.js";

const OptionsSchema = Zod.object({
  siteUrl: Zod.url({
    protocol: /^https?$/,
    hostname: Zod.regexes.domain,
  }).transform((url) => url.trim().replace(/\/+$/, "")),
  rootPath: Zod.string().trim().min(1),
  extensions: Zod.array(Zod.string().regex(/^\.\w+$/))
    .optional()
    .default([".js", ".mjs", ".ts"]),
  loadModule: Zod.custom<ModuleLoader>(
    (value) => typeof value === "function",
    "loadModule must be a function",
  ),
});

type Config = Zod.infer<typeof OptionsSchema>;

export function resolveOptions(options: Options): Config {
  return OptionsSchema.parse(options);
}
