import type { FetchEvent } from "@edge-runtime/primitives"
import type { RouteMatcherOutput } from "next-route-matcher"

// TODO: this should be exported directly from next-route-matcher
type RouteParams = RouteMatcherOutput["routeParams"]

export interface EdgeSpecRequestOptions {
  pathParams?: RouteParams
}

export type WithEdgeSpecRequestOptions<T> = T & EdgeSpecRequestOptions

export type EdgeSpecRequest = WithEdgeSpecRequestOptions<Request>
export type EdgeSpecResponse = Response

export type EdgeSpecRouteFn = (
  req: EdgeSpecRequest
) => Promise<EdgeSpecResponse>

export type EdgeSpecFetchEvent = FetchEvent & {
  request: EdgeSpecRequest
}
