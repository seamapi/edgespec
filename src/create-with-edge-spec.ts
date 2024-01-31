import { z } from "zod"
import type { GlobalSpec } from "./types/global-spec.js"
import { Middleware } from "./types/middleware.js"
import { CreateWithRouteSpecFn, RouteSpec } from "./types/route-spec.js"
import {
  EdgeSpecFormDataResponse,
  EdgeSpecJsonResponse,
  EdgeSpecRequest,
  EdgeSpecResponse,
  EdgeSpecRouteFn,
  EdgeSpecCustomResponse,
  SerializableToResponse,
  mergeResponses,
  setEdgeSpecRequestOptions,
  EdgeSpecUrlEncodedResponse,
} from "./types/web-handler.js"

export const createWithEdgeSpec = <const GS extends GlobalSpec>(
  globalSpec: GS
): CreateWithRouteSpecFn<GS> => {
  const handleErr = async (req: EdgeSpecRequest, e: any) => {
    const exceptionRouteFn = globalSpec.exceptionHandlingRoute?.(e)

    if (exceptionRouteFn) {
      return await exceptionRouteFn(req)
    }

    throw e
  }

  return (routeSpec) =>
    finalizeEdgeSpecRouteFn(
      globalSpec,
      routeSpec,
      handleErr,
      (routeFn) => async (request) => {
        const onMultipleAuthMiddlewareFailures =
          globalSpec.onMultipleAuthMiddlewareFailures ??
          routeSpec.onMultipleAuthMiddlewareFailures

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

        request = await runAllMiddlewares(request, globalSpec.globalMiddlewares)

        if (authMiddlewares.length > 0) {
          try {
            request = await runFirstMiddleware(request, authMiddlewares)
          } catch (err: any) {
            if (err instanceof AggregateError) {
              if (err.errors.length > 1) {
                onMultipleAuthMiddlewareFailures?.(err.errors)
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

        return await routeFn(requestWithMiddlewares)
      }
    )
}

/**
 * Ensure that the default response is always merged with the final output
 * response from the route function.
 *
 * Without this, headers accumulated through middleware would never make their
 * way to the final response
 *
 * This also handles validation of the response and serializing it from an
 * EdgeSpecResponse to a wintercg-compatible Response
 *
 * Finally, this wraps everything in a try/catch block to handle exceptions
 */
const finalizeEdgeSpecRouteFn =
  <T, R extends Response | SerializableToResponse>(
    globalSpec: GlobalSpec,
    routeSpec: RouteSpec<any>,
    handleError: (
      req: EdgeSpecRequest,
      e: any
    ) => Promise<Response | SerializableToResponse>,
    routeFn: (fn: EdgeSpecRouteFn<T, R>) => EdgeSpecRouteFn<{}, R>
  ): ((fn: EdgeSpecRouteFn<T, R>) => EdgeSpecRouteFn) =>
  (fn) =>
  async (req) => {
    try {
      const rawResponse = await routeFn(fn)(req)

      const response = serializeToResponse(globalSpec, routeSpec, rawResponse)

      return mergeResponses(req.responseDefaults, response)
    } catch (e: any) {
      const rawResponse = await handleError(req, e)

      return "serializeToResponse" in rawResponse
        ? rawResponse.serializeToResponse(z.any())
        : rawResponse
    }
  }

function serializeToResponse(
  globalSpec: GlobalSpec,
  routeSpec: RouteSpec<any>,
  response: SerializableToResponse | Response
): Response {
  const shouldValidateResponse = globalSpec.shouldValidateResponses ?? true

  if (!shouldValidateResponse) {
    return "serializeToResponse" in response
      ? response.serializeToResponse(z.any())
      : response
  }

  if (response instanceof EdgeSpecResponse) {
    if (response instanceof EdgeSpecJsonResponse) {
      return response.serializeToResponse(routeSpec.jsonResponse ?? z.any())
    }

    if (response instanceof EdgeSpecFormDataResponse) {
      return response.serializeToResponse(routeSpec.formDataResponse ?? z.any())
    }

    if (response instanceof EdgeSpecUrlEncodedResponse) {
      return response.serializeToResponse(
        routeSpec.wwwFormUrlEncodedResponse ?? z.any()
      )
    }

    if (response instanceof EdgeSpecCustomResponse) {
      return response.serializeToResponse(z.any())
    }
  }

  if ("serializeToResponse" in response) {
    throw new Error("Unknown Response type")
  }

  return response
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
