import type { BuildOptions } from "esbuild"

export interface BundleOptions {
  rootDirectory: string
  routesDirectory: string
  esbuild?: BuildOptions
  /**
   * This should not be provided in most cases so your bundle is maximally portable.
   */
  // todo: should this be an internal-only option?
  bundledAdapter?: "wintercg-minimal"
}
