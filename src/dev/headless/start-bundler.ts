import path from "path"
import { getTempPathInApp } from "src/bundle/get-temp-path-in-app.ts"
import { bundleAndWatch } from "src/bundle/watch.ts"
import { ResolvedEdgeSpecConfig } from "src/config/utils.ts"
import { ChannelOptions, createBirpcGroup } from "birpc"
import { HttpServerRpcFunctions, type BundlerRpcFunctions } from "./types.ts"
import type { BuildResult } from "esbuild"
import * as esbuild from "esbuild"
import { AsyncWorkTracker } from "src/lib/async-work-tracker.ts"

export interface StartHeadlessDevBundlerOptions {
  config: ResolvedEdgeSpecConfig
  initialRpcChannels?: ChannelOptions[]
}

/**
 * Start a headless EdgeSpec dev bundler. It will continuously watch your code and rebuild on changes.
 * For this to be useful, you'll probably want to also start a headless dev server.
 * This must be run within a native context (Node.js, Bun, or Deno).
 */
export const startHeadlessDevBundler = async ({
  config,
  initialRpcChannels,
}: StartHeadlessDevBundlerOptions) => {
  const tempDir = await getTempPathInApp(config.rootDirectory)
  const devBundlePath = path.join(tempDir, "dev-bundle.js")

  const buildTracker = new AsyncWorkTracker<
    BuildResult & { buildUpdatedAtMs: number }
  >()

  const rpcFunctions: BundlerRpcFunctions = {
    async waitForAvailableBuild() {
      const result = await buildTracker.waitForResult()
      return {
        buildUpdatedAtMs: Date.now(),
        build:
          result.errors.length === 0
            ? {
                type: "success",
                bundlePath: devBundlePath,
              }
            : {
                type: "failure",
                errors: result.errors,
              },
      }
    },
  }

  const birpc = createBirpcGroup<HttpServerRpcFunctions, BundlerRpcFunctions>(
    rpcFunctions,
    initialRpcChannels ?? [],
    { eventNames: ["onBuildStart", "onBuildEnd"] }
  )

  const { stop } = await bundleAndWatch({
    rootDirectory: config.rootDirectory,
    routesDirectory: config.routesDirectory,
    bundledAdapter:
      config.platform === "wintercg-minimal" ? "wintercg-minimal" : undefined,
    esbuild: {
      platform: config.platform === "wintercg-minimal" ? "browser" : "node",
      outfile: devBundlePath,
      write: true,
      plugins: [
        {
          name: "watch",
          setup(build) {
            build.onStart(async () => {
              buildTracker.beginAsyncWork()
              await birpc.broadcast.onBuildStart()
            })

            build.onEnd(async (result) => {
              buildTracker.finishAsyncWork({
                ...result,
                buildUpdatedAtMs: Date.now(),
              })
              await birpc.broadcast.onBuildEnd({
                success: result.errors.length === 0,
                errorMessage: (
                  await esbuild.formatMessages(result.errors, { kind: "error" })
                ).join("\n"),
              })
            })
          },
        },
      ],
    },
  })

  return {
    stop,
    birpc,
  }
}
