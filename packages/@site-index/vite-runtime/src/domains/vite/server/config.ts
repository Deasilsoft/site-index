import * as Vite from "vite";

export function makeServerConfig(
  input: Vite.ResolvedConfig,
): Vite.InlineConfig {
  const output: Vite.InlineConfig = {
    root: input.root,
    mode: input.mode,
    appType: "custom",
    server: {
      middlewareMode: true,
      hmr: false,
    },
  };

  if (input.configFile !== undefined) {
    output.configFile = input.configFile;
  }

  return output;
}
