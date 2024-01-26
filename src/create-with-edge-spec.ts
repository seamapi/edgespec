import type { GlobalSpec } from "./types/global-spec.js"
import { Middleware } from "./types/middleware.js"
import { CreateWithRouteSpecFn } from "./types/route-spec.js"
import {
  EdgeSpecRequest,
  EdgeSpecRouteFn,
  setEdgeSpecRequestOptions,
} from "./types/web-handler.js"

export const createWithEdgeSpec = <const GS extends GlobalSpec>(
  globalSpec: GS
): CreateWithRouteSpecFn<GS> => {
  return (routeSpec) =>
    (routeFn): EdgeSpecRouteFn =>
    async (request) => {
      const handleErr = async (e: any) => {
        const exceptionRouteFn = globalSpec.exceptionHandlingMiddleware?.(e)

        if (exceptionRouteFn) {
          return await exceptionRouteFn(request)
        }

        throw e
      }

      type RequestOptions = typeof routeFn extends EdgeSpecRouteFn<infer R>
        ? R
        : never

      const supportedAuthMiddlewares = new Set<string>(
        routeSpec.auth === "none"
          ? []
          : Array.isArray(routeSpec.auth)
            ? routeSpec.auth
            : [routeSpec.auth]
      )

      const authMiddlewares = Object.entries(globalSpec.authMiddlewareMap)
        .filter(([k, _]) => supportedAuthMiddlewares.has(k))
        .map(([_, v]) => v)

      let requestWithMiddlewares: EdgeSpecRequest<RequestOptions>

      try {
        request = await runAllMiddlewares(request, globalSpec.globalMiddlewares)

        if (authMiddlewares.length > 0) {
          try {
            request = await runFirstMiddleware(request, authMiddlewares)
          } catch (err: any) {
            if (err instanceof AggregateError) {
              if (err.errors.length > 1) {
                globalSpec.onMultipleAuthMiddlewareFailures?.(err.errors)
              }

              throw err.errors[0]
            }

            throw err
          }
        }

        if (globalSpec.globalMiddlewaresAfterAuth) {
          request = await runAllMiddlewares(
            request,
            globalSpec.globalMiddlewaresAfterAuth
          )
        }

        if (routeSpec.middlewares) {
          request = await runAllMiddlewares(request, routeSpec.middlewares)
        }

        requestWithMiddlewares = request as EdgeSpecRequest<RequestOptions>
      } catch (e) {
        return await handleErr(e)
      }

      try {
        return await routeFn(requestWithMiddlewares)
      } catch (e) {
        return await handleErr(e)
      }
    }
}

async function runAllMiddlewares<R = object>(
  initialRequest: EdgeSpecRequest,
  middlewares: readonly Middleware[]
): Promise<EdgeSpecRequest<R>> {
  return (await middlewares.reduce(async (lastRequestPromise, middleware) => {
    const lastRequest = await lastRequestPromise

    const newRequestOpts = await middleware(lastRequest)

    return setEdgeSpecRequestOptions(lastRequest, newRequestOpts)
  }, Promise.resolve(initialRequest))) as EdgeSpecRequest<R>
}

async function runFirstMiddleware<R>(
  initialRequest: EdgeSpecRequest,
  middlewares: readonly Middleware[],
  isValid: (err: any) => boolean = () => true
): Promise<EdgeSpecRequest<R>> {
  const errors: any[] = []

  for (const middleware of middlewares) {
    try {
      const newRequestOpts = await middleware(initialRequest)

      return setEdgeSpecRequestOptions(
        initialRequest,
        newRequestOpts
      ) as EdgeSpecRequest<R>
    } catch (e: any) {
      if (!isValid(e)) {
        throw e
      }

      errors.push(e)
    }
  }

  throw new AggregateError(errors)
}
