import type { z } from "zod"
import type {
  AccumulateMiddlewareChainResultOptions,
  MiddlewareChain,
  MapMiddlewares,
} from "./middleware"
import type {
  GetAuthMiddlewaresFromGlobalSpec,
  GlobalSpec,
} from "./global-spec"
import type {
  EdgeSpecCustomResponse,
  EdgeSpecFormDataResponse,
  EdgeSpecJsonResponse,
  EdgeSpecRouteFn,
  EdgeSpecUrlEncodedResponse,
} from "./web-handler"

export type RouteSpec<AuthMiddlewares extends string> = {
  methods: readonly ("GET" | "POST" | "PUT" | "PATCH" | "DELETE")[]

  jsonBody?: z.ZodTypeAny
  formData?: z.ZodObject<any>
  queryParams?: z.ZodObject<any>
  commonParams?: z.ZodObject<any>

  jsonResponse?: z.ZodTypeAny
  formDataResponse?: z.ZodObject<any>
  wwwFormUrlEncodedResponse?: z.ZodObject<any>
  customResponseMap?: Record<string, z.ZodTypeAny>

  auth: AuthMiddlewares | readonly AuthMiddlewares[] | "none"
  middlewares?: MiddlewareChain

  /**
   * add x-fern-sdk-return-value to the openapi spec, useful when you want to return only a subset of the response
   */
  sdkReturnValue?: string | string[]
  openApiMetadata?: any

  onMultipleAuthMiddlewareFailures?: (errors: unknown[]) => void
}

type CustomResponseMapToEdgeSpecResponse<
  M extends Record<string, z.ZodTypeAny>,
  K extends keyof M = keyof M,
> = K extends keyof M & string
  ? EdgeSpecCustomResponse<z.output<M[K]>, K>
  : never

type GetRouteSpecResponseType<
  GS extends GlobalSpec,
  RS extends RouteSpec<GetAuthMiddlewaresFromGlobalSpec<GS>>,
> =
  | (RS["jsonResponse"] extends z.ZodTypeAny
      ? EdgeSpecJsonResponse<z.output<RS["jsonResponse"]>>
      : never)
  | (RS["formDataResponse"] extends z.ZodObject<any>
      ? EdgeSpecFormDataResponse<z.output<RS["formDataResponse"]>>
      : never)
  | (RS["wwwFormUrlEncodedResponse"] extends z.ZodObject<any>
      ? EdgeSpecUrlEncodedResponse<z.output<RS["wwwFormUrlEncodedResponse"]>>
      : never)
  | (RS["customResponseMap"] extends Record<string, z.ZodTypeAny>
      ? CustomResponseMapToEdgeSpecResponse<RS["customResponseMap"]>
      : never)
  | Response

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

export type EdgeSpecRouteFnFromSpecs<
  GS extends GlobalSpec,
  RS extends RouteSpec<GetAuthMiddlewaresFromGlobalSpec<GS>>,
> = EdgeSpecRouteFn<
  GetMiddlewareRequestOptions<GS, RS>,
  GetRouteSpecResponseType<GS, RS>
>

export type CreateWithRouteSpecFn<GS extends GlobalSpec> = <
  const RS extends RouteSpec<GetAuthMiddlewaresFromGlobalSpec<GS>>,
>(
  routeSpec: RS
) => (route: EdgeSpecRouteFnFromSpecs<GS, RS>) => EdgeSpecRouteFn
