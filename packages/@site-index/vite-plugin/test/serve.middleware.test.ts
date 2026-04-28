import type { Artifact } from "@site-index/core";
import { describe, expect, it, vi } from "vitest";
import { makeArtifactsMiddleware } from "../src/domains/serve/artifacts.middleware";
import { createResponseStub } from "./helpers/http.stub.js";

function toRequestPath(filePath: string): string {
  return filePath.startsWith("/") ? filePath : `/${filePath}`;
}

function createArtifactsByRequestPath(artifacts: Array<Artifact>) {
  return new Map(
    artifacts.map((artifact) => [toRequestPath(artifact.filePath), artifact]),
  );
}

describe("createArtifactsMiddleware", () => {
  it("serves sitemap xml for GET /sitemap.xml", () => {
    const middleware = makeArtifactsMiddleware(
      createArtifactsByRequestPath([
        {
          filePath: "sitemap.xml",
          content: "INDEX_XML",
          contentType: "application/xml; charset=utf-8",
        },
      ]),
    );

    const res = createResponseStub();
    const next = vi.fn();

    middleware(
      { url: "/sitemap.xml", method: "GET" } as never,
      res as never,
      next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/xml; charset=utf-8",
    );
    expect(res.statusCode).toBe(200);
    expect(res.end).toHaveBeenCalledWith("INDEX_XML");
  });

  it("serves robots text for GET /robots.txt", () => {
    const middleware = makeArtifactsMiddleware(
      createArtifactsByRequestPath([
        {
          filePath: "robots.txt",
          content: "User-agent: *",
          contentType: "text/plain; charset=utf-8",
        },
      ]),
    );

    const res = createResponseStub();
    const next = vi.fn();

    middleware(
      { url: "/robots.txt", method: "GET" } as never,
      res as never,
      next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "text/plain; charset=utf-8",
    );
    expect(res.statusCode).toBe(200);
    expect(res.end).toHaveBeenCalledWith("User-agent: *");
  });

  it("serves named sitemap xml for GET /sitemap-*.xml", () => {
    const middleware = makeArtifactsMiddleware(
      createArtifactsByRequestPath([
        {
          filePath: "sitemap-blog.xml",
          content: "BLOG_XML",
          contentType: "application/xml; charset=utf-8",
        },
      ]),
    );

    const res = createResponseStub();
    const next = vi.fn();

    middleware(
      { url: "/sitemap-blog.xml", method: "GET" } as never,
      res as never,
      next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/xml; charset=utf-8",
    );
    expect(res.statusCode).toBe(200);
    expect(res.end).toHaveBeenCalledWith("BLOG_XML");
  });

  it("returns headers and status but no body for HEAD /sitemap.xml", () => {
    const middleware = makeArtifactsMiddleware(
      createArtifactsByRequestPath([
        {
          filePath: "sitemap.xml",
          content: "INDEX_XML",
          contentType: "application/xml; charset=utf-8",
        },
      ]),
    );

    const res = createResponseStub();
    const next = vi.fn();

    middleware(
      { url: "/sitemap.xml", method: "HEAD" } as never,
      res as never,
      next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/xml; charset=utf-8",
    );
    expect(res.statusCode).toBe(200);
    expect(res.end).toHaveBeenCalledWith();
  });

  it("falls through for unknown path", () => {
    const middleware = makeArtifactsMiddleware(
      createArtifactsByRequestPath([
        {
          filePath: "sitemap.xml",
          content: "INDEX_XML",
          contentType: "application/xml; charset=utf-8",
        },
      ]),
    );

    const res = createResponseStub();
    const next = vi.fn();

    middleware(
      { url: "/favicon.ico", method: "GET" } as never,
      res as never,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.end).not.toHaveBeenCalled();
  });

  it("falls through when known artifact route is requested but artifact is missing", () => {
    const middleware = makeArtifactsMiddleware(
      createArtifactsByRequestPath([
        {
          filePath: "sitemap.xml",
          content: "INDEX_XML",
          contentType: "application/xml; charset=utf-8",
        },
      ]),
    );

    const res = createResponseStub();
    const next = vi.fn();

    middleware(
      { url: "/sitemap-blog.xml", method: "GET" } as never,
      res as never,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.end).not.toHaveBeenCalled();
  });

  it("falls through safely when request has no url", () => {
    const middleware = makeArtifactsMiddleware(
      createArtifactsByRequestPath([
        {
          filePath: "sitemap.xml",
          content: "INDEX_XML",
          contentType: "application/xml; charset=utf-8",
        },
      ]),
    );

    const res = createResponseStub();
    const next = vi.fn();

    middleware({ method: "GET" } as never, res as never, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.end).not.toHaveBeenCalled();
  });
});
