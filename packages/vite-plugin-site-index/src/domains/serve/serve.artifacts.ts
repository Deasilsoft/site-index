import * as SiteIndex from "site-index";
import * as Vite from "vite";
import type { Options } from "../options/types.js";
import { createArtifactsMiddleware } from "./serve.middleware.js";
import { makeServeRefresh } from "./serve.refresh.js";

const WATCHER_EVENTS = ["add", "change", "unlink"] as const;

function toRequestPath(filePath: string): string {
  return filePath.startsWith("/") ? filePath : `/${filePath}`;
}

export function serveArtifacts(
  server: Vite.ViteDevServer,
  options: Options,
  viteConfig: Vite.ResolvedConfig,
): void {
  const artifactsByRequestPath = new Map<string, SiteIndex.Artifact>();
  let relevantFiles: Set<string> | undefined;

  function updateState(result: {
    artifacts: SiteIndex.Artifact[];
    nextRelevantFiles: Set<string>;
  }): void {
    artifactsByRequestPath.clear();

    for (const artifact of result.artifacts) {
      artifactsByRequestPath.set(toRequestPath(artifact.filePath), artifact);
    }

    relevantFiles = result.nextRelevantFiles;
  }

  const refresh = makeServeRefresh(server, options, viteConfig, updateState);

  function requestRefresh(): void {
    void refresh.requestRefresh();
  }

  function handleWatcherEvent(filePath: string): void {
    if (relevantFiles === undefined) {
      return;
    }

    if (!relevantFiles.has(filePath)) {
      return;
    }

    requestRefresh();
  }

  server.middlewares.use(createArtifactsMiddleware(artifactsByRequestPath));

  for (const event of WATCHER_EVENTS) {
    server.watcher.on(event, handleWatcherEvent);
  }

  server.httpServer?.once("close", () => {
    for (const event of WATCHER_EVENTS) {
      server.watcher.off(event, handleWatcherEvent);
    }
  });

  requestRefresh();
}
