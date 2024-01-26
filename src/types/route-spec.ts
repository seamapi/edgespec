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
