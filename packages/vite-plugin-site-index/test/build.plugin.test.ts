import * as SiteIndex from "site-index";
import type { ResolvedConfig } from "vite";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { siteIndexBuildPlugin } from "../src/index.js";
import { makeRuntimeServer } from "../src/shared/vite-runtime.js";
import { getPluginHookHandler } from "./helpers/plugin-hooks.js";

vi.mock("site-index", () => ({
  main: vi.fn(),
}));

vi.mock("../src/shared/vite-runtime.js", async () => {
  const actual = await vi.importActual<
    typeof import("../src/shared/vite-runtime.js")
  >("../src/shared/vite-runtime.js");

  return {
    ...actual,
    makeRuntimeServer: vi.fn(),
  };
});

describe("siteIndexBuildPlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards runtime warnings and emits artifact.filePath as-is", async () => {
    vi.mocked(makeRuntimeServer).mockResolvedValue({
      ssrLoadModule: vi.fn(async () => ({ default: { siteIndexes: [] } })),
      close: vi.fn(async () => undefined),
    } as never);

    vi.mocked(SiteIndex.main).mockResolvedValue({
      data: [
        {
          filePath: "robots.txt",
          content: "ROBOTS",
          contentType: "text/plain; charset=utf-8",
        },
        {
          filePath: "bad-path?x=y#z",
          content: "BAD",
          contentType: "text/plain; charset=utf-8",
        },
      ],
      warnings: [{ message: "Duplicate URL: /about" }],
    });

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

    expect(makeRuntimeServer).toHaveBeenCalledWith(resolvedConfig);
    expect(vi.mocked(SiteIndex.main)).toHaveBeenCalledTimes(1);
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
    const close = vi.fn(async () => undefined);

    vi.mocked(makeRuntimeServer).mockResolvedValue({
      ssrLoadModule: vi.fn(async () => ({ default: { siteIndexes: [] } })),
      close,
    } as never);

    vi.mocked(SiteIndex.main).mockResolvedValue({ data: [], warnings: [] });

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

    expect(vi.mocked(SiteIndex.main)).toHaveBeenCalledTimes(1);
    expect(emitFile).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("fails on upstream errors and still closes the runtime server", async () => {
    const close = vi.fn(async () => undefined);
    vi.mocked(makeRuntimeServer).mockResolvedValue({
      ssrLoadModule: vi.fn(async () => ({ default: { siteIndexes: [] } })),
      close,
    } as never);

    const upstreamError = new Error("pipeline exploded");
    vi.mocked(SiteIndex.main).mockRejectedValue(upstreamError);

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

    expect(close).toHaveBeenCalledTimes(1);
  });

  it("throws if buildStart is called before configResolved", async () => {
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
