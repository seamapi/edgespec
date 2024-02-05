import type { z } from "zod"
import type {
  AccumulateMiddlewareChainResultOptions,
  MiddlewareChain,
  MapMiddlewares,
} from "../middleware/types"
import type {
  GetAuthMiddlewaresFromGlobalSpec,
  GlobalSpec,
} from "./global-spec"
import type {
  EdgeSpecCustomResponse,
  EdgeSpecMultiPartFormDataResponse,
  EdgeSpecJsonResponse,
  EdgeSpecRouteFn,
  HTTPMethods,
  EdgeSpecRouteParams,
} from "./web-handler"

export type RouteSpec<AuthMiddlewares extends string> = {
  methods: readonly HTTPMethods[]

  jsonBody?: z.ZodTypeAny
  multiPartFormData?: z.ZodObject<any>
  queryParams?: z.ZodObject<any>
  commonParams?: z.ZodObject<any>
  urlEncodedFormData?: z.ZodObject<any>
  routeParams?: z.ZodObject<any>

  jsonResponse?: z.ZodTypeAny
  multipartFormDataResponse?: z.ZodObject<any>
  customResponseMap?: Record<string, z.ZodTypeAny>

  auth?:
    | AuthMiddlewares
    | readonly AuthMiddlewares[]
    | "none"
    | null
    | undefined

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
  | (RS["multipartFormDataResponse"] extends z.ZodObject<any>
      ? EdgeSpecMultiPartFormDataResponse<
          z.output<RS["multipartFormDataResponse"]>
        >
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
        MapMiddlewares<
          GS["authMiddlewareMap"],
          RS["auth"] extends undefined | null
            ? "none"
            : Exclude<RS["auth"], undefined | null>
        >,
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
  (RS["multiPartFormData"] extends infer ZT extends z.ZodObject<any>
    ? { multiPartFormData: z.output<ZT> }
    : {}) &
  (RS["queryParams"] extends infer ZT extends z.ZodObject<any>
    ? { query: z.output<ZT> }
    : {}) &
  (RS["commonParams"] extends infer ZT extends z.ZodObject<any>
    ? { commonParams: z.output<ZT> }
    : {}) &
  (RS["urlEncodedFormData"] extends infer ZT extends z.ZodObject<any>
    ? { urlEncodedFormData: z.output<ZT> }
    : {}) &
  (RS["routeParams"] extends infer ZT extends z.ZodObject<any>
    ? { routeParams: z.output<ZT> }
    : { routeParams: EdgeSpecRouteParams })

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
