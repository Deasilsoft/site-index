import type { Plugin } from "vite";

export function getPluginHookHandler<T extends (...args: never[]) => unknown>(
  hook: Plugin[keyof Plugin],
): T {
  if (typeof hook === "function") {
    return hook as T;
  }

  if (hook && typeof hook === "object" && "handler" in hook) {
    return hook.handler as T;
  }

  throw new Error("Expected plugin hook to exist");
}
