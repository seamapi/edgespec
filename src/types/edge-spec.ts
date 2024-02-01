import {
  createEdgeSpecRequest,
  SerializableToResponse,
  type EdgeSpecRouteFn,
  type EdgeSpecRouteParams,
} from "./web-handler.js"

import type { ReadonlyDeep } from "type-fest"

export type EdgeSpecRouteMatcher = (pathname: string) =>
  | {
      matchedRoute: string
      routeParams: EdgeSpecRouteParams
    }
  | undefined
  | null

export type EdgeSpecRouteMap = Record<string, EdgeSpecRouteFn>

export interface EdgeSpecOptions {
  handleModuleServiceRouteNotFound?: EdgeSpecRouteFn
  handle404?: EdgeSpecRouteFn
}

// make this deeply immutable to force usage through helper functions
export type EdgeSpecRouteBundle = ReadonlyDeep<
  EdgeSpecOptions & {
    routeMatcher: EdgeSpecRouteMatcher
    routeMapWithHandlers: EdgeSpecRouteMap
  }
>

export type EdgeSpecAdapter<
  Options extends Array<unknown> = [],
  ReturnValue = void,
> = (edgeSpec: EdgeSpecRouteBundle, ...options: Options) => ReturnValue

export function handleRequestWithEdgeSpec(
  edgeSpec: EdgeSpecRouteBundle,
  pathnameOverride?: string
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const {
      routeMatcher,
      routeMapWithHandlers,
      handle404 = () =>
        new Response("Not found", {
          status: 404,
        }),
    } = edgeSpec

    const pathname = pathnameOverride ?? new URL(request.url).pathname
    const { matchedRoute, routeParams } = routeMatcher(pathname) ?? {}

    const routeFn = matchedRoute && routeMapWithHandlers[matchedRoute]

    const edgeSpecRequest = createEdgeSpecRequest(request, {
      edgeSpec,
      pathParams: routeParams,
      responseDefaults: new Response(),
    })

    if (!routeFn) {
      return await handle404(edgeSpecRequest)
    }

    return await routeFn(edgeSpecRequest)
  }
}
