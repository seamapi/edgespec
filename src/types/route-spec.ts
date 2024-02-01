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
  HTTPMethods,
} from "./web-handler"

export type RouteSpec<AuthMiddlewares extends string> = {
  methods: readonly HTTPMethods[]

  jsonBody?: z.ZodTypeAny
  formData?: z.ZodObject<any>
  queryParams?: z.ZodObject<any>
  commonParams?: z.ZodObject<any>
  urlEncodedFormData?: z.ZodObject<any>

  jsonResponse?: z.ZodTypeAny
  formDataResponse?: z.ZodObject<any>
  customResponseMap?: Record<string, z.ZodTypeAny>

  auth: AuthMiddlewares | readonly AuthMiddlewares[] | "none"
  middlewares?: MiddlewareChain

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
  > &
  (RS["jsonBody"] extends infer ZT extends z.ZodTypeAny
    ? { jsonBody: z.output<ZT> }
    : {}) &
  (RS["formData"] extends infer ZT extends z.ZodObject<any>
    ? { formDataBody: z.output<ZT> }
    : {}) &
  (RS["queryParams"] extends infer ZT extends z.ZodObject<any>
    ? { query: z.output<ZT> }
    : {}) &
  (RS["commonParams"] extends infer ZT extends z.ZodObject<any>
    ? { commonParams: z.output<ZT> }
    : {}) &
  (RS["urlEncodedFormData"] extends infer ZT extends z.ZodObject<any>
    ? { urlEncodedFormData: z.output<ZT> }
    : {})

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
