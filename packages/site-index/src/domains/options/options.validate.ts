import { z } from "zod";
import type { ModuleLoader, Options } from "./types.js";

const trimTrailingSlashes = (url: string): string => {
  return url.trim().replace(/\/+$/, "");
};

const OptionsSchema = z.object({
  siteUrl: z
    .url({
      protocol: /^https?$/,
      hostname: z.regexes.domain,
    })
    .transform(trimTrailingSlashes),
  rootPath: z.string().trim().min(1),
  extensions: z
    .array(z.string().regex(/^\.\w+$/))
    .optional()
    .default([".js", ".mjs", ".ts"]),
  loadModules: z.custom<ModuleLoader>(
    (value) => typeof value === "function",
    "loadDiscoveredModules must be a function",
  ),
});

type Config = z.infer<typeof OptionsSchema>;

export function validateOptions(options: Options): Config {
  return OptionsSchema.parse(options);
}
