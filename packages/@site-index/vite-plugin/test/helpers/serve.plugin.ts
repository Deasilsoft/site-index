import type { Plugin, ViteDevServer } from "vite";
import { vi } from "vitest";
import { siteIndexServePlugin } from "../../src/index.js";
import { getPluginHookHandler } from "./plugin-hooks.js";
import { createRuntimeBuilderMock } from "./runtime.builder.mock.js";
import { createViteDevServerMock } from "./vite-dev-server.mock.js";

type BuildArtifactsResult = {
  data: unknown[];
  warnings: Array<{ message: string; filePath?: string | undefined }>;
};

type RuntimeInput = {
  buildArtifacts?: () => Promise<BuildArtifactsResult>;
  getArtifacts?: () => Array<{
    filePath: string;
    content: string;
    contentType: string;
  }>;
  getWatchedFiles?: () => ReadonlySet<string>;
};

type MiddlewareResponse = {
  setHeader(name: string, value: string): void;
  statusCode: number;
  end(body?: string): void;
};

export function createServeRuntimeMock(input?: RuntimeInput) {
  return {
    buildArtifacts: vi.fn(
      input?.buildArtifacts ?? (async () => ({ data: [], warnings: [] })),
    ),
    getArtifacts: vi.fn(input?.getArtifacts ?? (() => [])),
    getWatchedFiles: vi.fn(input?.getWatchedFiles ?? (() => new Set<string>())),
    close: vi.fn(async () => {}),
  };
}

export async function setupServePlugin(input: {
  runtime: ReturnType<typeof createServeRuntimeMock>;
  createRuntimeServiceMock: ReturnType<typeof vi.fn>;
  configureServer?: boolean;
}) {
  const { builder, withOptions, withViteServer } = createRuntimeBuilderMock(
    input.runtime,
  );
  input.createRuntimeServiceMock.mockReturnValue(builder as never);

  const plugin = siteIndexServePlugin({ siteUrl: "https://example.com" });
  const server = createViteDevServerMock();

  if (input.configureServer !== false) {
    await getPluginHookHandler<
      (current: ViteDevServer) => Promise<void> | void
    >(plugin.configureServer)(server);
  }

  return { plugin, server, withOptions, withViteServer };
}

export function getRegisteredMiddleware(
  server: ViteDevServer,
): (
  req: { url?: string; method?: string },
  res: MiddlewareResponse,
  next: () => void,
) => void {
  const use = server.middlewares.use as unknown as ReturnType<typeof vi.fn>;
  return use.mock.calls[0]?.[0] as (
    req: { url?: string; method?: string },
    res: MiddlewareResponse,
    next: () => void,
  ) => void;
}

export async function triggerHotUpdate(input: {
  plugin: Plugin;
  server: ViteDevServer;
  file: string;
}) {
  await getPluginHookHandler<
    (ctx: { file: string; server: ViteDevServer }) => Promise<void>
  >(input.plugin.handleHotUpdate)({
    file: input.file,
    server: input.server,
  });
}

export async function triggerCloseBundle(plugin: Plugin) {
  await getPluginHookHandler<() => Promise<void>>(plugin.closeBundle)();
}
