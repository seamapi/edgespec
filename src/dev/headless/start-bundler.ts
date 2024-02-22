import path from "path"
import { getTempPathInApp } from "src/bundle/get-temp-path-in-app.ts"
import { bundleAndWatch } from "src/bundle/watch.ts"
import { ResolvedEdgeSpecConfig } from "src/config/utils.ts"
import { createBirpcGroup } from "birpc"
import type { BundlerRpcFunctions } from "./types.ts"
import type { BuildResult } from "esbuild"
import EventEmitter from "node:events"
import * as esbuild from "esbuild"

// todo: extract into new file
class AsyncWorkTracker<Result> extends EventEmitter {
  private state: "idle" | "pending" | "resolved" = "idle"
  private lastResult: Result | undefined

  async waitForResult(): Promise<Result> {
    if (this.state === "pending" || !this.lastResult) {
      return new Promise<Result>((resolve) => {
        this.once("result", resolve)
      })
    }

    if (!this.lastResult) {
      throw new Error("No last result (this should never happen)")
    }

    return this.lastResult
  }

  beginAsyncWork() {
    this.state = "pending"
  }

  finishAsyncWork(result: Result) {
    this.state = "resolved"
    this.emit("result", result)
    this.lastResult = result
  }
}

export interface StartHeadlessDevBundlerOptions {
  config: ResolvedEdgeSpecConfig
  onBuildStart?: () => void
  onBuildEnd?: ({
    success,
    errorMessage,
  }: {
    success: boolean
    errorMessage?: string
  }) => void
}

/**
 * Start a headless EdgeSpec dev bundler. It will continuously watch your code and rebuild on changes.
 * For this to be useful, you'll probably want to also start a headless dev server.
 * This must be run within a native context (Node.js, Bun, or Deno).
 */
export const startHeadlessDevBundler = async ({
  config,
  onBuildStart,
  onBuildEnd,
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

  const birpc = createBirpcGroup(rpcFunctions, [])

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
            build.onStart(() => {
              onBuildStart?.()
              buildTracker.beginAsyncWork()
            })

            build.onEnd(async (result) => {
              buildTracker.finishAsyncWork({
                ...result,
                buildUpdatedAtMs: Date.now(),
              })
              onBuildEnd?.({
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
