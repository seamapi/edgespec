import type { z } from "zod"
import type {
  AccumulateMiddlewareChainResultOptions,
  MiddlewareChain,
  Middleware,
  MapMiddlewares,
} from "./middleware"
import type {
  GetAuthMiddlewaresFromGlobalSpec,
  GlobalSpec,
} from "./global-spec"
import type { EdgeSpecRouteFn } from "./web-handler"
import type { InferRecordKey } from "./util"

export type RouteSpec<AuthMiddlewares extends string> = {
  methods: readonly ("GET" | "POST" | "PUT" | "PATCH" | "DELETE")[]

  jsonBody?: z.ZodTypeAny
  jsonResponse?: z.ZodTypeAny

  auth: AuthMiddlewares | readonly AuthMiddlewares[] | "none"
  middlewares?: MiddlewareChain
}

/**
 * Collects all middleware request options from a Global/Route spec pair
 *
 * This goes in order of execution:
 *  1. Global middlewares (intersection)
 *  2. Auth middlewares (union)
 *  3. Global middlewares after auth (intersection)
 *  4. Route middlewares (intersection)
 */
type GetMiddlewareRequestOptions<
  GS extends GlobalSpec,
  RS extends RouteSpec<GetAuthMiddlewaresFromGlobalSpec<GS>>,
> = AccumulateMiddlewareChainResultOptions<
  GS["globalMiddlewares"],
  "intersection"
> &
  (RS["auth"] extends "none"
    ? {}
    : AccumulateMiddlewareChainResultOptions<
        MapMiddlewares<GS["authMiddlewareMap"], RS["auth"]>,
        "union"
      >) &
  AccumulateMiddlewareChainResultOptions<
    GS["globalMiddlewaresAfterAuth"] extends MiddlewareChain
      ? GS["globalMiddlewaresAfterAuth"]
      : readonly [],
    "intersection"
  > &
  AccumulateMiddlewareChainResultOptions<
    RS["middlewares"] extends MiddlewareChain ? RS["middlewares"] : readonly [],
    "intersection"
  >

export type CreateWithRouteSpecFn<GS extends GlobalSpec> = <
  const RS extends RouteSpec<InferRecordKey<GS["authMiddlewareMap"]>>,
>(
  routeSpec: RS
) => (
  route: EdgeSpecRouteFn<GetMiddlewareRequestOptions<GS, RS>>
) => EdgeSpecRouteFn
