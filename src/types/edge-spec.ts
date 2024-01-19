import {
  createEdgeSpecRequest,
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
  routeMatcher: EdgeSpecRouteMatcher
  routeMapWithHandlers: EdgeSpecRouteMap

  handleModuleServiceRouteNotFound?: EdgeSpecRouteFn
  handle404?: EdgeSpecRouteFn
}

// make this deeply immutable to force usage through helper functions
export type EdgeSpecRouteBundle = ReadonlyDeep<EdgeSpecOptions>

export type EdgeSpecAdapter<
  Options extends Array<unknown> = [],
  ReturnValue = void,
> = (edgeSpec: EdgeSpecRouteBundle, ...options: Options) => ReturnValue

export async function handleRequestWithEdgeSpec(
  edgeSpec: EdgeSpecRouteBundle,
  request: Request,
  pathnameOverride?: string
): Promise<Response> {
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
  })

  if (!routeFn) {
    return await handle404(edgeSpecRequest)
  }

  const response: Response = await routeFn(edgeSpecRequest)

  return response
}
