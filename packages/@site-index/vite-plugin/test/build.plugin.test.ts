import type { ResolvedConfig } from "vite";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { siteIndexBuildPlugin } from "../src/index.js";
import { getPluginHookHandler } from "./helpers/plugin-hooks.js";

const makeViteSiteIndexPipelineServiceMock = vi.hoisted(() => vi.fn());

vi.mock("@site-index/vite-runtime", () => ({
  makeViteSiteIndexPipelineService: makeViteSiteIndexPipelineServiceMock,
}));

describe("siteIndexBuildPlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards runtime warnings and emits artifact.filePath as-is", async () => {
    const warningListeners: Array<(warning: string) => void> = [];
    const artifactListeners: Array<
      (artifact: { type: "asset"; fileName: string; source: string }) => void
    > = [];

    const service = {
      setViteConfig: vi.fn(),
      prepareArtifacts: vi.fn(async () => {
        for (const listener of warningListeners) {
          listener("Duplicate URL: /about");
        }
      }),
      publishArtifacts: vi.fn(() => {
        for (const listener of artifactListeners) {
          listener({ type: "asset", fileName: "robots.txt", source: "ROBOTS" });
          listener({
            type: "asset",
            fileName: "bad-path?x=y#z",
            source: "BAD",
          });
        }
      }),
      onWarning: vi.fn((listener: (warning: string) => void) => {
        warningListeners.push(listener);
        return () => {
          const index = warningListeners.indexOf(listener);
          if (index >= 0) {
            warningListeners.splice(index, 1);
          }
        };
      }),
      onArtifact: vi.fn(
        (
          listener: (artifact: {
            type: "asset";
            fileName: string;
            source: string;
          }) => void,
        ) => {
          artifactListeners.push(listener);
          return () => {
            const index = artifactListeners.indexOf(listener);
            if (index >= 0) {
              artifactListeners.splice(index, 1);
            }
          };
        },
      ),
      configureServer: vi.fn(),
      onError: vi.fn(),
    };

    makeViteSiteIndexPipelineServiceMock.mockReturnValue(service as never);

    const plugin = siteIndexBuildPlugin({ siteUrl: "https://example.com" });
    const resolvedConfig = {
      command: "build",
      root: "/repo",
      mode: "production",
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    } as unknown as ResolvedConfig;

    const configResolved = getPluginHookHandler<
      (resolved: ResolvedConfig) => void | Promise<void>
    >(plugin.configResolved);

    configResolved(resolvedConfig);

    const warn = vi.fn();

    const buildStart = getPluginHookHandler<
      (this: {
        info(message: string): void;
        warn(message: string): void;
        error(message: string): void;
      }) => void | Promise<void>
    >(plugin.buildStart);

    await buildStart.call({
      info: vi.fn(),
      warn,
      error: vi.fn(),
    });

    const emitFile = vi.fn();

    const generateBundle = getPluginHookHandler<
      (this: {
        emitFile(asset: {
          type: "asset";
          fileName: string;
          source: string;
        }): void;
      }) => void | Promise<void>
    >(plugin.generateBundle);

    generateBundle.call({ emitFile });

    expect(makeViteSiteIndexPipelineServiceMock).toHaveBeenCalledWith(
      { siteUrl: "https://example.com" },
      "@site-index/vite-plugin",
    );
    expect(service.setViteConfig).toHaveBeenCalledWith(resolvedConfig);
    expect(service.prepareArtifacts).toHaveBeenCalledTimes(1);
    expect(service.publishArtifacts).toHaveBeenCalledTimes(1);
    expect(emitFile).toHaveBeenCalledTimes(2);
    expect(emitFile).toHaveBeenNthCalledWith(1, {
      type: "asset",
      fileName: "robots.txt",
      source: "ROBOTS",
    });
    expect(emitFile).toHaveBeenNthCalledWith(2, {
      type: "asset",
      fileName: "bad-path?x=y#z",
      source: "BAD",
    });
    expect(warn).toHaveBeenCalledWith("Duplicate URL: /about");
  });

  it("emits nothing when SiteIndex.main returns no artifacts", async () => {
    const service = {
      setViteConfig: vi.fn(),
      prepareArtifacts: vi.fn(async () => undefined),
      publishArtifacts: vi.fn(() => undefined),
      onWarning: vi.fn(() => () => undefined),
      onArtifact: vi.fn(() => () => undefined),
      configureServer: vi.fn(),
      onError: vi.fn(),
    };

    makeViteSiteIndexPipelineServiceMock.mockReturnValue(service as never);

    const plugin = siteIndexBuildPlugin({ siteUrl: "https://example.com" });

    const configResolved = getPluginHookHandler<
      (resolved: ResolvedConfig) => void | Promise<void>
    >(plugin.configResolved);

    configResolved({
      command: "serve",
      root: "/repo",
      mode: "development",
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    } as unknown as ResolvedConfig);

    const buildStart = getPluginHookHandler<
      (this: {
        info(message: string): void;
        warn(message: string): void;
        error(message: string): void;
      }) => void | Promise<void>
    >(plugin.buildStart);

    await buildStart.call({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    });

    const emitFile = vi.fn();
    const generateBundle = getPluginHookHandler<
      (this: { emitFile: typeof emitFile }) => void | Promise<void>
    >(plugin.generateBundle);

    generateBundle.call({ emitFile });

    expect(service.prepareArtifacts).toHaveBeenCalledTimes(1);
    expect(service.publishArtifacts).toHaveBeenCalledTimes(1);
    expect(emitFile).not.toHaveBeenCalled();
  });

  it("fails on upstream errors and still closes the runtime server", async () => {
    const upstreamError = new Error("pipeline exploded");
    const service = {
      setViteConfig: vi.fn(),
      prepareArtifacts: vi.fn(async () => {
        throw upstreamError;
      }),
      publishArtifacts: vi.fn(),
      onWarning: vi.fn(() => () => undefined),
      onArtifact: vi.fn(() => () => undefined),
      configureServer: vi.fn(),
      onError: vi.fn(),
    };

    makeViteSiteIndexPipelineServiceMock.mockReturnValue(service as never);

    const plugin = siteIndexBuildPlugin({ siteUrl: "https://example.com" });

    const configResolved = getPluginHookHandler<
      (resolved: ResolvedConfig) => void | Promise<void>
    >(plugin.configResolved);

    configResolved({
      command: "build",
      root: "/repo",
      mode: "production",
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    } as unknown as ResolvedConfig);

    const buildStart = getPluginHookHandler<
      (this: {
        info(message: string): void;
        warn(message: string): void;
        error(message: string): void;
      }) => void | Promise<void>
    >(plugin.buildStart);

    await expect(
      buildStart.call({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }),
    ).rejects.toBe(upstreamError);

    expect(service.prepareArtifacts).toHaveBeenCalledTimes(1);
  });

  it("throws if buildStart is called before configResolved", async () => {
    const service = {
      setViteConfig: vi.fn(),
      prepareArtifacts: vi.fn(async () => {
        throw new Error(
          "[vite-plugin-site-index] Vite config could not be resolved",
        );
      }),
      publishArtifacts: vi.fn(),
      onWarning: vi.fn(() => () => undefined),
      onArtifact: vi.fn(() => () => undefined),
      configureServer: vi.fn(),
      onError: vi.fn(),
    };

    makeViteSiteIndexPipelineServiceMock.mockReturnValue(service as never);

    const plugin = siteIndexBuildPlugin({ siteUrl: "https://example.com" });

    const buildStart = getPluginHookHandler<
      (this: {
        info(message: string): void;
        warn(message: string): void;
        error(message: string): void;
      }) => void | Promise<void>
    >(plugin.buildStart);

    await expect(
      buildStart.call({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }),
    ).rejects.toThrow(
      "[vite-plugin-site-index] Vite config could not be resolved",
    );
  });
});
