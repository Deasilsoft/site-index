import type * as SiteIndex from "site-index";
import * as Vite from "vite";

export function createArtifactsMiddleware(
  artifactsByRequestPath: Map<string, SiteIndex.Artifact>,
): Vite.Connect.NextHandleFunction {
  return (req, res, next) => {
    if (!req.url) {
      return next();
    }

    const path = new URL(req.url, "http://localhost").pathname;
    const artifact = artifactsByRequestPath.get(path);

    if (!artifact) {
      return next();
    }

    res.setHeader("Content-Type", artifact.contentType);
    res.statusCode = 200;

    if (req.method === "HEAD") {
      res.end();

      return;
    }

    res.end(artifact.content);
  };
}
