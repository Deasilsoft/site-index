import { z as Zod } from "zod";
import type { LoadModule, Options } from "./types.js";

const OptionsSchema = Zod.object({
  siteUrl: Zod.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    Zod.url({
      protocol: /^https?$/,
      hostname: Zod.regexes.domain,
    }).transform((url) => url.replace(/\/+$/, "")),
  ),
  rootPath: Zod.string().trim().min(1),
  extensions: Zod.array(Zod.string().regex(/^\.\w+$/))
    .optional()
    .default([".js", ".mjs", ".ts"]),
  loadModule: Zod.custom<LoadModule>(
    (value) => typeof value === "function",
    "loadModule must be a function",
  ),
});

type Config = Zod.infer<typeof OptionsSchema>;

export function resolveOptions(options: Options): Config {
  return OptionsSchema.parse(options);
}
