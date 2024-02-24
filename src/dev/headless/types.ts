export type BundlerBuildResult = {
  buildUpdatedAtMs: number
} & (
  | {
      type: "success"
      bundlePath: string
    }
  | {
      type: "failure"
      errorMessage: string
    }
)

export type BundlerRpcFunctions = {
  waitForAvailableBuild: () => Promise<BundlerBuildResult>
}

export type HttpServerRpcFunctions = {
  onBuildStart: () => void
  onBuildEnd: (build: BundlerBuildResult) => void
}
