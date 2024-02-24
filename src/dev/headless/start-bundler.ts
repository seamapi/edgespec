import path from "path"
import { getTempPathInApp } from "src/bundle/get-temp-path-in-app.ts"
import { bundleAndWatch } from "src/bundle/watch.ts"
import { ResolvedEdgeSpecConfig } from "src/config/utils.ts"
import { ChannelOptions, createBirpcGroup } from "birpc"
import {
  HttpServerRpcFunctions,
  type BundlerRpcFunctions,
  BundlerBuildResult,
} from "./types.ts"
import { formatMessages } from "esbuild"
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

  const buildTracker = new AsyncWorkTracker<BundlerBuildResult>()

  const rpcFunctions: BundlerRpcFunctions = {
    async waitForAvailableBuild() {
      return buildTracker.waitForResult()
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
      packages: config.platform === "node" ? "external" : undefined,
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
              let build: BundlerBuildResult
              if (result.errors.length === 0) {
                build = {
                  type: "success",
                  bundlePath: devBundlePath,
                  buildUpdatedAtMs: Date.now(),
                }
              } else {
                build = {
                  type: "failure",
                  errorMessage: (
                    await formatMessages(result.errors, {
                      kind: "error",
                    })
                  ).join("\n"),
                  buildUpdatedAtMs: Date.now(),
                }
              }

              buildTracker.finishAsyncWork(build)
              await birpc.broadcast.onBuildEnd(build)
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
