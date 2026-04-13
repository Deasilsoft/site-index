import type { ArtifactsRef, Middleware } from "./types.js";

function isArtifactUrl(url: string): boolean {
  return (
    url === "/sitemap.xml" ||
    (url.startsWith("/sitemap-") && url.endsWith(".xml")) ||
    url === "/robots.txt"
  );
}

function contentTypeFor(path: string): string {
  return path.endsWith(".xml") ? "application/xml" : "text/plain";
}

export function createMiddleware(
  artifactsRef: ArtifactsRef,
  refreshArtifacts: () => Promise<void>,
): Middleware {
  return async (req, res, next) => {
    if (!req.url) return next();

    if (isArtifactUrl(req.url)) {
      await refreshArtifacts();
    }

    const artifact = artifactsRef.current.find(
      (artifact) => artifact.path === req.url,
    );

    if (!artifact) return next();

    res.setHeader("Content-Type", contentTypeFor(artifact.path));
    res.end(artifact.content);
  };
}
