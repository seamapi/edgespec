import type { fetch } from "@edge-runtime/primitives"

export declare class ModuleService {
  constructor(routeMap: Record<string, Function>): ModuleService
  fetch(
    reqOrUrl: Request | string,
    opts?: Parameters<typeof fetch>[1]
  ): ReturnType<typeof fetch>
}
