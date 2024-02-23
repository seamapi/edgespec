import path from "path"
import { getTempPathInApp } from "src/bundle/get-temp-path-in-app.ts"
import { bundleAndWatch } from "src/bundle/watch.ts"
import { ResolvedEdgeSpecConfig } from "src/config/utils.ts"
import TypedEmitter from "typed-emitter"
import { HeadlessBuildEvents } from "./types.ts"

export interface StartHeadlessDevBundlerOptions {
  config: ResolvedEdgeSpecConfig
  headlessEventEmitter: TypedEmitter.default<HeadlessBuildEvents>
}

/**
 * Start a headless EdgeSpec dev bundler. It will continuously watch your code and rebuild on changes.
 * For this to be useful, you'll probably want to also start a headless dev server.
 * This must be run within a native context (Node.js, Bun, or Deno).
 */
export const startHeadlessDevBundler = async ({
  config,
  headlessEventEmitter,
}: StartHeadlessDevBundlerOptions) => {
  const tempDir = await getTempPathInApp(config.rootDirectory)
  const devBundlePath = path.join(tempDir, "dev-bundle.js")

  const { stop } = await bundleAndWatch({
    rootDirectory: config.rootDirectory,
    routesDirectory: config.routesDirectory,
    bundledAdapter:
      config.platform === "wintercg-minimal" ? "wintercg-minimal" : undefined,
    esbuild: {
      platform: config.platform === "wintercg-minimal" ? "browser" : "node",
      packages: "external",
      outfile: devBundlePath,
      write: true,
      plugins: [
        {
          name: "watch",
          setup(build) {
            build.onStart(() => {
              headlessEventEmitter.emit("started-building")
            })

            build.onEnd(async () => {
              headlessEventEmitter.emit("finished-building", {
                bundlePath: devBundlePath,
              })
            })
          },
        },
      ],
    },
  })

  return { stop }
}
