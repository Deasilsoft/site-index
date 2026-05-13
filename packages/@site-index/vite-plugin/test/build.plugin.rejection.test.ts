import type { ResolvedConfig } from "vite";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { siteIndexBuildPlugin } from "../src/index.js";
import { getPluginHookHandler } from "./helpers/plugin-hooks.js";
import { createRuntimeBuilderMock } from "./helpers/runtime.builder.mock.js";

const createRuntimeServiceMock = vi.hoisted(() => vi.fn());

vi.mock("@site-index/vite-runtime", () => ({
  createRuntimeService: createRuntimeServiceMock,
}));

describe("siteIndexBuildPlugin rejections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("closes the runtime and bubbles buildArtifacts errors", async () => {
    const runtime = {
      buildArtifacts: vi.fn(async () => {
        throw new Error("pipeline exploded");
      }),
      getArtifacts: vi.fn(() => []),
      close: vi.fn(async () => {}),
    };

    const { builder } = createRuntimeBuilderMock(runtime);

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

    await expect(
      buildStart.call({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }),
    ).rejects.toThrow("pipeline exploded");

    expect(runtime.close).toHaveBeenCalledTimes(1);

    const closeBundle = getPluginHookHandler<() => Promise<void> | void>(
      plugin.closeBundle,
    );

    await closeBundle();

    expect(runtime.close).toHaveBeenCalledTimes(1);
  });
});
