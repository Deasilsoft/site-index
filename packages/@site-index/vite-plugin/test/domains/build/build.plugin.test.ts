import type { ResolvedConfig } from "vite";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { siteIndexBuildPlugin } from "../../../src/index.js";
import { getPluginHookHandler } from "../../helpers/plugin-hooks.js";
import { createRuntimeBuilderMock } from "../../helpers/runtime.builder.mock.js";

const createRuntimeServiceMock = vi.hoisted(() => vi.fn());

vi.mock("@site-index/vite-runtime", () => ({
  createRuntimeService: createRuntimeServiceMock,
}));

describe("siteIndexBuildPlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds artifacts, forwards warnings, and emits runtime artifacts", async () => {
    const runtime = {
      buildArtifacts: vi.fn(async () => ({
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
      })),
      getArtifacts: vi.fn(() => [
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
      ]),
      getWatchedFiles: vi.fn(() => new Set<string>()),
      close: vi.fn(async () => {}),
    };

    const { builder, withOptions, withViteConfig } =
      createRuntimeBuilderMock(runtime);

    createRuntimeServiceMock.mockReturnValue(builder as never);

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

    const buildStart = getPluginHookHandler<
      (this: {
        info(message: string): void;
        warn(message: string): void;
        error(message: string): void;
        emitFile(asset: Record<string, unknown>): void;
      }) => void | Promise<void>
    >(plugin.buildStart);

    await buildStart.call({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      emitFile: vi.fn(),
    });

    const emitFile = vi.fn();
    const generateBundle = getPluginHookHandler<
      (this: {
        emitFile(asset: Record<string, unknown>): void;
      }) => void | Promise<void>
    >(plugin.generateBundle);

    generateBundle.call({ emitFile });

    const closeBundle = getPluginHookHandler<() => Promise<void> | void>(
      plugin.closeBundle,
    );

    await closeBundle();

    expect(createRuntimeServiceMock).toHaveBeenCalledTimes(1);
    expect(withOptions).toHaveBeenCalledWith({
      siteUrl: "https://example.com",
    });

    expect(withViteConfig).toHaveBeenCalledWith(resolvedConfig);
    expect(runtime.buildArtifacts).toHaveBeenCalledTimes(1);
    expect(resolvedConfig.logger.warn).toHaveBeenCalledWith(
      "Warning: Duplicate URL: /about",
    );

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

    expect(runtime.close).toHaveBeenCalledTimes(1);
  });

  it("emits a private runtime chunk for SSR builds", async () => {
    const runtime = {
      buildArtifacts: vi.fn(async () => ({
        data: [],
        warnings: [],
      })),
      getArtifacts: vi.fn(() => []),
      getWatchedFiles: vi.fn(
        () =>
          new Set([
            "/repo/src/routes.site-index.ts",
            "/repo/src/not-site-index.ts",
            "/repo/src/another.site-index.mjs",
          ]),
      ),
      close: vi.fn(async () => {}),
    };

    const { builder } = createRuntimeBuilderMock(runtime);

    createRuntimeServiceMock.mockReturnValue(builder as never);

    const plugin = siteIndexBuildPlugin({ siteUrl: "https://example.com" });
    const resolvedConfig = {
      command: "build",
      root: "/repo",
      mode: "production",
      build: {
        ssr: true,
      },
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

    const buildStart = getPluginHookHandler<
      (this: {
        info(message: string): void;
        warn(message: string): void;
        error(message: string): void;
        emitFile(asset: Record<string, unknown>): void;
      }) => void | Promise<void>
    >(plugin.buildStart);

    const emitRuntimeChunk = vi.fn();

    await buildStart.call({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      emitFile: emitRuntimeChunk,
    });

    const resolveId = getPluginHookHandler<
      (id: string) => string | undefined | Promise<string | undefined>
    >(plugin.resolveId);
    const load = getPluginHookHandler<
      (id: string) => string | undefined | Promise<string | undefined>
    >(plugin.load);

    expect(resolveId("virtual:site-index/runtime-entry")).toBe(
      "\0site-index/runtime-entry",
    );

    const runtimeSource = load("\0site-index/runtime-entry");

    expect(runtimeSource).toContain("buildArtifactsFromLoadedModules");
    expect(runtimeSource).toContain('import module0 from "/repo/src/another.site-index.mjs";');
    expect(runtimeSource).toContain('import module1 from "/repo/src/routes.site-index.ts";');
    expect(runtimeSource).not.toContain("not-site-index");

    expect(emitRuntimeChunk).toHaveBeenCalledTimes(1);
    expect(emitRuntimeChunk).toHaveBeenCalledWith({
      type: "chunk",
      id: "virtual:site-index/runtime-entry",
      fileName: "site-index.runtime.mjs",
    });
  });
});
