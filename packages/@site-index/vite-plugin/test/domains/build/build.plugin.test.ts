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
      }) => void | Promise<void>
    >(plugin.buildStart);

    await buildStart.call({
      info: vi.fn(),
      warn: vi.fn(),
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
});

