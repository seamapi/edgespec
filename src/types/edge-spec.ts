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
  /**
   * Defaults to true. When true, we will attempt to automatically remove any pathname prefix from the request. This is useful when you're hosting an EdgeSpec service on a subpath of your application.
   *
   * For example, if you're hosting an EdgeSpec service "Foo" at /foo/[...path], then this option will automatically remove the /foo prefix from the request so that the Foo service only sees /[...path].
   */
  automaticallyRemovePathnamePrefix?: boolean

  /**
   * If you want to manually remove a pathname prefix, you can specify it here. `automaticallyRemovePathnamePrefix` must be false when specifying this option.
   */
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

export function makeRequestAgainstEdgeSpec(
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

    const { removePathnamePrefix, automaticallyRemovePathnamePrefix = true } =
      options

    let pathname = new URL(request.url).pathname
    if (removePathnamePrefix) {
      if (automaticallyRemovePathnamePrefix) {
        throw new Error(
          "automaticallyRemovePathnamePrefix and removePathnamePrefix cannot both be specified"
        )
      }

      pathname = pathname.replace(removePathnamePrefix, "")
    } else {
      const pathSegments = pathname.split("/").filter(Boolean)
      let matchingPath: string | undefined = undefined
      for (let i = pathSegments.length; i >= 0; i--) {
        const path = `/${pathSegments.slice(i).join("/")}`
        if (routeMatcher(path)) {
          matchingPath = path
        }
      }

      pathname = matchingPath ?? pathname
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
