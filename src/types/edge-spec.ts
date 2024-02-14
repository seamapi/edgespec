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
  handle404?: EdgeSpecRouteFn
}

interface MakeRequestOptions {
  removePathnamePrefix?: string
}

// make this deeply immutable to force usage through helper functions
export type EdgeSpecRouteBundle = ReadonlyDeep<
  EdgeSpecOptions & {
    routeMatcher: EdgeSpecRouteMatcher
    routeMapWithHandlers: EdgeSpecRouteMap
    makeRequest: (
      request: Request,
      options?: MakeRequestOptions
    ) => Promise<Response>
  }
>

export type EdgeSpecAdapter<
  Options extends Array<unknown> = [],
  ReturnValue = void,
> = (edgeSpec: EdgeSpecRouteBundle, ...options: Options) => ReturnValue

export function handleRequestWithEdgeSpec(
  edgeSpec: EdgeSpecRouteBundle,
  options: MakeRequestOptions = {}
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

    let pathname = new URL(request.url).pathname
    if (options.removePathnamePrefix) {
      pathname = pathname.replace(options.removePathnamePrefix, "")
    }

    const { matchedRoute, routeParams } = routeMatcher(pathname) ?? {}

    const routeFn = matchedRoute && routeMapWithHandlers[matchedRoute]

    const edgeSpecRequest = createEdgeSpecRequest(request, {
      edgeSpec,
      routeParams: routeParams ?? {},
      responseDefaults: new Response(),
    })

    if (!routeFn) {
      return await handle404(edgeSpecRequest)
    }

    return await routeFn(edgeSpecRequest)
  }
}
