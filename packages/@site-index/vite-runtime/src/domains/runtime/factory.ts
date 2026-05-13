import { RuntimeServiceBuilder } from "./builder.js";

export function createRuntimeService(): RuntimeServiceBuilder {
  return new RuntimeServiceBuilder();
}
