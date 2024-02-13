import { once } from "node:events"
import fs from "node:fs/promises"
import { EdgeRuntime } from "edge-runtime"
import { Mutex } from "async-mutex"
import TypedEmitter from "typed-emitter"
import { handleRequestWithEdgeSpec } from "src/types/edge-spec"
import { HeadlessBuildEvents } from "./types"

export class RequestHandlerController {
  private bundlerState: "building" | "idle" = "idle"
  private cachedWinterCGRuntime?: EdgeRuntime
  private cachedNodeHandler?: ReturnType<typeof handleRequestWithEdgeSpec>
  private bundlePathPromise: Promise<string>

  private winterCGLoaderMutex = new Mutex()
  private nodeHandlerLoaderMutex = new Mutex()

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
    this.bundlePathPromise = initialBundlePath
      ? Promise.resolve(initialBundlePath)
      : once(headlessEventEmitter, "finished-building").then(
          ([{ bundlePath }]) => bundlePath
        )
  }

  async getWinterCGRuntime() {
    if (this.cachedWinterCGRuntime) {
      return this.cachedWinterCGRuntime
    }

    return this.winterCGLoaderMutex.runExclusive(async () => {
      return await this.retryIfBundleInvalidedDuringCallback(async () => {
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

  async getNodeHandler() {
    if (this.cachedNodeHandler) {
      return this.cachedNodeHandler
    }

    return this.nodeHandlerLoaderMutex.runExclusive(async () => {
      return await this.retryIfBundleInvalidedDuringCallback(async () => {
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
    this.cachedWinterCGRuntime = undefined
    this.cachedNodeHandler = undefined
  }

  private handleFinishedBuilding() {
    this.bundlerState = "idle"
  }

  private async retryIfBundleInvalidedDuringCallback<T>(
    callback: () => T
  ): Promise<T> {
    if (this.bundlerState === "building") {
      await once(this.headlessEventEmitter, "finished-building")
    }

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
      return await this.retryIfBundleInvalidedDuringCallback(
        callback.bind(this)
      )
    }

    return result
  }
}
