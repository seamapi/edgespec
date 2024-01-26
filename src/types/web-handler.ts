import type { FetchEvent } from "@edge-runtime/primitives"
import { EdgeSpecRouteBundle } from "./edge-spec"

export type EdgeSpecRouteParams = {
  [routeParam: string]: string | string[]
}

export interface EdgeSpecMiddlewareOptions {
  headers?: Record<string, string>
}

export interface EdgeSpecRequestOptions extends EdgeSpecMiddlewareOptions {
  edgeSpec: EdgeSpecRouteBundle
  pathParams?: EdgeSpecRouteParams
}

export type WithEdgeSpecRequestOptions<T> = T & EdgeSpecRequestOptions

export type EdgeSpecRequest<T = {}> = WithEdgeSpecRequestOptions<Request> & T

export type EdgeSpecResponse = Response

export type EdgeSpecRouteFn<RequestOptions = {}> = (
  req: EdgeSpecRequest<RequestOptions>
) => EdgeSpecResponse | Promise<EdgeSpecResponse>

export type EdgeSpecFetchEvent = FetchEvent & {
  request: EdgeSpecRequest
}

export function createEdgeSpecRequest(
  request: Request,
  options: EdgeSpecRequestOptions
): EdgeSpecRequest {
  return Object.assign(request, options)
}

export function setEdgeSpecRequestOptions<RequestOptions>(
  request: EdgeSpecRequest,
  options: RequestOptions & EdgeSpecMiddlewareOptions
): EdgeSpecRequest<RequestOptions> {
  return Object.assign(request, {
    ...options,
    headers: {
      ...request.headers,
      ...options.headers,
    },
  })
}
