import { MapArray } from "./util"
import { EdgeSpecRequest } from "./web-handler"

export type Middleware<RequiredOptions = {}, ResultOptions = object> = (
  request: EdgeSpecRequest<RequiredOptions>
) => ResultOptions | Promise<ResultOptions>

export type MiddlewareChain = readonly Middleware[]

/**
 * Collect all result options from a middleware chain
 *
 * For example:
 *
 *  Middleware<{}, { auth: string }>
 *  Middleware<{}, { user: string }>
 *
 *  ->
 *
 *  { auth: string, user: string }
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

// type t = AccumulateMiddlewareChainResultOptions<
//   [Middleware<{}, { auth: "1" }>, Middleware<{}, { auth2: "2" }>],
//   "union"
// >
