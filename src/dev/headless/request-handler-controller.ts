import { once } from "node:events"
import fs from "node:fs/promises"
import { EdgeRuntime } from "edge-runtime"
import { Mutex } from "async-mutex"
import TypedEmitter from "typed-emitter"
import { handleRequestWithEdgeSpec } from "src/types/edge-spec"
import { HeadlessBuildEvents } from "./types"

export class RequestHandlerController {
  // This is so we know if the bundler is currently building when we need to load the runtime
  private bundlerState: "building" | "idle" = "idle"
  private cachedWinterCGRuntime?: EdgeRuntime
  private cachedNodeHandler?: ReturnType<typeof handleRequestWithEdgeSpec>

  private bundlePathPromise: Promise<string>

  // This prevents race conditions if there are multiple concurrent .getWinterCGRuntime() or .getNodeHandler() calls
  private loaderPromiseChain = new Mutex()

  constructor(
    private headlessEventEmitter: TypedEmitter<HeadlessBuildEvents>,
    initialBundlePath?: string
  ) {
    headlessEventEmitter.on(
      "started-building",
      this.handleStartedBuilding.bind(this)
    )
    headlessEventEmitter.on(
      "finished-building",
      this.handleFinishedBuilding.bind(this)
    )

    // Sometimes we know the bundle path ahead of time, otherwise we wait for the first build to finish to fetch the path
    this.bundlePathPromise = initialBundlePath
      ? Promise.resolve(initialBundlePath)
      : once(headlessEventEmitter, "finished-building").then(
          ([{ bundlePath }]) => bundlePath
        )
  }

  /**
   * You **should not** cache the result of this function. Call it every time you want to use the runtime.
   */
  async getWinterCGRuntime() {
    return this.loaderPromiseChain.runExclusive(async () => {
      if (this.cachedWinterCGRuntime) {
        return this.cachedWinterCGRuntime
      }

      return await this.executeCallbackWhenBundleIsReady(async () => {
        const contents = await fs.readFile(
          await this.bundlePathPromise,
          "utf-8"
        )
        this.cachedWinterCGRuntime = new EdgeRuntime({
          initialCode: contents,
        })
        return this.cachedWinterCGRuntime
      })
    })
  }

  /**
   * You **should not** cache the result of this function. Call it every time you want to use the handler.
   */
  async getNodeHandler() {
    return this.loaderPromiseChain.runExclusive(async () => {
      if (this.cachedNodeHandler) {
        return this.cachedNodeHandler
      }

      return await this.executeCallbackWhenBundleIsReady(async () => {
        // We append the timestamp to the path to bust the cache
        const edgeSpecModule = await import(
          `file:${await this.bundlePathPromise}#${Date.now()}`
        )
        // If the file is imported as CJS, the default export is nested.
        // Naming this with .mjs seems to break some on-the-fly transpiling tools downstream.
        const defaultExport =
          edgeSpecModule.default.default ?? edgeSpecModule.default
        this.cachedNodeHandler = handleRequestWithEdgeSpec(defaultExport)

        return this.cachedNodeHandler
      })
    })
  }

  teardown() {
    this.headlessEventEmitter.off(
      "started-building",
      this.handleStartedBuilding
    )
    this.headlessEventEmitter.off(
      "finished-building",
      this.handleFinishedBuilding
    )
  }

  private handleStartedBuilding() {
    this.bundlerState = "building"
    // Invalidate cached handlers
    this.cachedWinterCGRuntime = undefined
    this.cachedNodeHandler = undefined
  }

  private handleFinishedBuilding() {
    this.bundlerState = "idle"
  }

  private async executeCallbackWhenBundleIsReady<T>(
    callback: () => T
  ): Promise<T> {
    // If currently building, wait for it to finish
    if (this.bundlerState === "building") {
      await once(this.headlessEventEmitter, "finished-building")
    }

    // If the bundler started building while the callback was executing, we'll need to re-run the callback
    let didStartBuildingDuringReload = false
    let finishedBuildingPromise: Promise<any> | undefined
    once(this.headlessEventEmitter, "started-building").then(() => {
      didStartBuildingDuringReload = true
      finishedBuildingPromise = once(
        this.headlessEventEmitter,
        "finished-building"
      )
    })

    const result = await callback()

    if (didStartBuildingDuringReload) {
      await finishedBuildingPromise
      return await this.executeCallbackWhenBundleIsReady(callback.bind(this))
    }

    return result
  }
}
