import { z } from "zod";
import type { LoadModule, Options } from "./types.js";

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
  loadModule: z.custom<LoadModule>(
    (value) => typeof value === "function",
    "loadModule must be a function",
  ),
});

type Config = z.infer<typeof OptionsSchema>;

export function validateOptions(options: Options): Config {
  return OptionsSchema.parse(options);
}
