import { Message } from "esbuild"

export type WaitForAvailableBuildResponse = {
  buildUpdatedAtMs: number
  build:
    | {
        type: "success"
        bundlePath: string
      }
    | {
        type: "failure"
        errors: Message[]
      }
}

export type BundlerRpcFunctions = {
  waitForAvailableBuild: () => Promise<WaitForAvailableBuildResponse>
}
