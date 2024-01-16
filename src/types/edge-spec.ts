import type { EdgeSpecRouteFn, EdgeSpecRouteParams } from "./web-handler"

export type EdgeSpecRouteMatcher = (pathname: string) => {
  matchedRoute: string
  routeParams: EdgeSpecRouteParams
}

export interface EdgeSpec {
  routeMatcher: EdgeSpecRouteMatcher
  routeMapWithHandlers: {
    [route: string]: EdgeSpecRouteFn
  }
}

export type EdgeSpecAdapter<ReturnValue = void> = (
  edgeSpec: EdgeSpec,
  port?: number
) => ReturnValue
