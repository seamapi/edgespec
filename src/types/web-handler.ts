import type { FetchEvent } from "@edge-runtime/primitives"
import {
  ModuleService,
  ModuleServiceOptions,
} from "src/adapters/module-service"
import { EdgeSpec } from "./edge-spec"

export type EdgeSpecRouteParams = {
  [routeParam: string]: string | string[]
}
export interface EdgeSpecRequestOptions {
  edgeSpec: EdgeSpec
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

export function createEdgeSpecRequest(
  request: Request,
  options: EdgeSpecRequestOptions
): EdgeSpecRequest {
  return Object.assign(request, options)
}
