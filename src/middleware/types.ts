import type { MapArray } from "../types/util.ts"
import type {
  EdgeSpecRequest,
  SerializableToResponse,
} from "../types/web-handler.ts"

export type Middleware<
  RequiredOptions = {},
  ResultOptions = object,
  Context = {},
> = (
  request: EdgeSpecRequest<
    RequiredOptions &
      Partial<ResultOptions> & {
        routeParams: Readonly<Record<string, unknown>>
      }
  >,
  ctx: Context,
  next: (
    request: EdgeSpecRequest<RequiredOptions & Partial<ResultOptions>>,
    ctx: Context
  ) => Promise<Response>
) =>
  | Response
  | SerializableToResponse
  | Promise<Response | SerializableToResponse>

export type MiddlewareChain<RequiredOptions = {}> =
  readonly Middleware<RequiredOptions>[]

/**
 * Collect all result options from a middleware chain
 *
 * For example:
 *
 * ```ts
 *  Middleware<{}, { auth: string }>
 *  Middleware<{}, { user: string }>
 *
 *  ->
 *
 *  { auth: string, user: string }
 * ```
 */
export type AccumulateMiddlewareChainResultOptions<
  MiddlewareChain,
  AccumulationType extends "union" | "intersection",
> = MiddlewareChain extends readonly [
  Middleware<any, infer ResultOptions>,
  ...infer Remaining,
]
  ? AccumulationType extends "intersection"
    ? ResultOptions &
        AccumulateMiddlewareChainResultOptions<Remaining, AccumulationType>
    :
        | ResultOptions
        | AccumulateMiddlewareChainResultOptions<Remaining, AccumulationType>
  : MiddlewareChain extends readonly any[]
    ? AccumulationType extends "intersection"
      ? {}
      : never
    : never

/**
 * Picks out a subset of middlewares from a map, maintaining the order given in the array
 *
 * For example:
 *
 * ```ts
 * MiddlewareMap = {
 *  "session_token": Middleware<{}, { session_token: string }>,
 *  "pat": Middleware<{}, { pat: string }>,
 *  "api_token": Middleware<{}, { api_token: string }>
 * }
 * Middlewares = ["session_token", "pat"]
 *
 * ->
 *
 * [ Middleware<{}, { session_token: string }>, Middleware<{}, { pat: string }> ]
 * ```
 *
 */
export type MapMiddlewares<
  MiddlewareMap extends { [mw: string]: Middleware },
  Middlewares extends
    | readonly (keyof MiddlewareMap)[]
    | keyof MiddlewareMap
    | "none",
> = Middlewares extends readonly (keyof MiddlewareMap)[]
  ? MapArray<MiddlewareMap, Middlewares>
  : Middlewares extends infer K extends keyof MiddlewareMap
    ? readonly [MiddlewareMap[K]]
    : readonly []
