import type { FetchEvent } from "@edge-runtime/primitives"
import { EdgeSpecRouteBundle } from "./edge-spec"

export type EdgeSpecRouteParams = {
  [routeParam: string]: string | string[]
}

export type HeadersDescriptor = Headers | HeadersInit

export type ResponseDescriptor =
  | Response
  | (Omit<ResponseInit, "headers"> & {
      body?: Response["body"]
      headers?: HeadersDescriptor
    })

export interface EdgeSpecMiddlewareOptions {
  responseDefaults?: ResponseDescriptor
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
  const r = Object.assign(request, {
    ...options,
    responseDefaults: mergeResponses(
      request.responseDefaults,
      options.responseDefaults
    ),
  })

  return r
}

export function mergeHeaders(
  h1: HeadersDescriptor | undefined | null,
  h2: HeadersDescriptor | undefined | null
) {
  return new Headers(
    Object.fromEntries([
      ...(h1 instanceof Headers
        ? h1
        : new Headers(h1 ?? undefined).entries() ?? []),
      ...(h2 instanceof Headers
        ? h2
        : new Headers(h2 ?? undefined).entries() ?? []),
    ])
  )
}

/**
 * Merge two responses together, with r2 overriding properties in r1
 *
 * This will merge the body, headers, status, and statusText of the two
 * responses
 */
export function mergeResponses(
  r1: ResponseDescriptor | undefined | null,
  r2: ResponseDescriptor | undefined | null
): Response {
  return new Response(r2?.body ?? r1?.body, {
    headers: mergeHeaders(r1?.headers, r2?.headers),
    status: r2?.status ?? r1?.status,
    statusText: r2?.statusText ?? r1?.statusText,
  })
}
