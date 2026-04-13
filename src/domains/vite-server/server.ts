import type { ViteDevServer } from "vite";
import { createMiddleware } from "./middleware.js";
import type { ArtifactsRef, RefreshFromDevServer } from "./types.js";

function isSiteIndexFile(file: string): boolean {
  return file.includes(".site-index.");
}

export function configureSiteIndexServer(
  server: ViteDevServer,
  artifactsRef: ArtifactsRef,
  refreshFromDevServer: RefreshFromDevServer,
): void {
  function logError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);

    server.config.logger.error(`[vite-plugin-site-index] ${message}`);
  }

  let inFlight: Promise<void> | null = null;
  let queued = false;

  async function runRefresh(): Promise<void> {
    try {
      await refreshFromDevServer(server);
    } catch (error) {
      logError(error);
    }
  }

  async function refreshSafely(): Promise<void> {
    if (inFlight !== null) {
      queued = true;

      await inFlight;

      return;
    }

    do {
      queued = false;
      inFlight = runRefresh();

      await inFlight;

      inFlight = null;
    } while (queued);
  }

  function onFileChange(file: string): void {
    if (!isSiteIndexFile(file)) {
      return;
    }

    void refreshSafely();
  }

  void refreshSafely();

  server.watcher.on("add", onFileChange);
  server.watcher.on("change", onFileChange);
  server.watcher.on("unlink", onFileChange);

  server.middlewares.use(
    createMiddleware(artifactsRef, async () => {
      await refreshSafely();
    }),
  );
}
