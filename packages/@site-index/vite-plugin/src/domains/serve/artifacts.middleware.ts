import type * as SiteIndex from "@site-index/core";
import * as Vite from "vite";

export function makeArtifactsMiddleware(
  artifacts: ReadonlyMap<string, SiteIndex.Artifact>,
): Vite.Connect.NextHandleFunction {
  return (request, res, next) => {
    if (!request.url) {
      return next();
    }

    const path = new URL(request.url, "http://localhost").pathname;
    const artifact = artifacts.get(path);

    if (!artifact) {
      return next();
    }

    res.setHeader("Content-Type", artifact.contentType);
    res.statusCode = 200;

    if (request.method === "HEAD") {
      res.end();

      return;
    }

    res.end(artifact.content);
  };
}
