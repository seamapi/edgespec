import type { FetchEvent } from "@edge-runtime/primitives"

export type EdgeSpecRouteParams = {
  [routeParam: string]: string | string[]
}
export interface EdgeSpecRequestOptions {
  pathParams?: EdgeSpecRouteParams
}

export type WithEdgeSpecRequestOptions<T> = T & EdgeSpecRequestOptions

export type EdgeSpecRequest = WithEdgeSpecRequestOptions<Request>
export type EdgeSpecResponse = Response

export type EdgeSpecRouteFn = (
  req: EdgeSpecRequest
) => EdgeSpecResponse | Promise<EdgeSpecResponse>

export type EdgeSpecFetchEvent = FetchEvent & {
  request: EdgeSpecRequest
}
