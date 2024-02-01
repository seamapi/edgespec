import { z } from "zod"
import type { GlobalSpec } from "./types/global-spec.js"
import { Middleware, MiddlewareChain } from "./types/middleware.js"
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
  EdgeSpecUrlEncodedResponse,
} from "./types/web-handler.js"
import { withMethods } from "./middleware/with-methods.js"

export const createWithEdgeSpec = <const GS extends GlobalSpec>(
  globalSpec: GS
): CreateWithRouteSpecFn<GS> => {
  return (routeSpec) => (routeFn) => async (request) => {
    const onMultipleAuthMiddlewareFailures =
      globalSpec.onMultipleAuthMiddlewareFailures ??
      routeSpec.onMultipleAuthMiddlewareFailures

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

    return await wrapMiddlewares(
      [
        serializeResponse(globalSpec, routeSpec, false),
        ...(globalSpec.exceptionHandlingMiddleware
          ? [globalSpec.exceptionHandlingMiddleware]
          : []),
        ...globalSpec.globalMiddlewares,
        firstAuthMiddlewareThatSucceeds(
          authMiddlewares,
          onMultipleAuthMiddlewareFailures
        ),
        ...(globalSpec.globalMiddlewaresAfterAuth ?? []),
        ...(routeSpec.middlewares ?? []),
        withMethods(routeSpec.methods),
        serializeResponse(globalSpec, routeSpec),
      ],
      routeFn,
      request
    )
  }
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
 */
const serializeResponse =
  <T, R extends Response | SerializableToResponse>(
    globalSpec: GlobalSpec,
    routeSpec: RouteSpec<any>,
    validate?: boolean
  ): Middleware =>
  async (next, req) => {
    const rawResponse = await next(req)

    const response = serializeToResponse(
      validate ?? globalSpec.shouldValidateResponses ?? true,
      routeSpec,
      rawResponse
    )

    return mergeResponses(req.responseDefaults, response)
  }

async function wrapMiddlewares(
  middlewares: MiddlewareChain,
  routeFn: EdgeSpecRouteFn<any, any>,
  request: EdgeSpecRequest
) {
  return await middlewares.reduceRight(
    (next, middleware) => {
      return async (req) => {
        return middleware(next, req)
      }
    },
    async (request: EdgeSpecRequest) => routeFn(request)
  )(request)
}

function serializeToResponse(
  shouldValidateResponse: boolean,
  routeSpec: RouteSpec<any>,
  response: SerializableToResponse | Response
): Response {
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

function firstAuthMiddlewareThatSucceeds(
  authMiddlewares: MiddlewareChain,
  onMultipleAuthMiddlewareFailures:
    | ((errs: unknown[]) => void)
    | null
    | undefined
): Middleware {
  return async (next, req) => {
    if (authMiddlewares.length === 0) {
      return next(req)
    }

    let errors: unknown[] = []
    let didAuthMiddlewareThrow = true

    for (const middleware of authMiddlewares) {
      try {
        return await middleware((...args) => {
          // Otherwise errors unrelated to auth thrown by built-in middleware (withMethods, withValidation) will be caught here
          didAuthMiddlewareThrow = false
          return next(...args)
        }, req)
      } catch (error) {
        if (didAuthMiddlewareThrow) {
          errors.push(error)
          continue
        } else {
          throw error
        }
      }
    }

    if (onMultipleAuthMiddlewareFailures && didAuthMiddlewareThrow) {
      onMultipleAuthMiddlewareFailures(errors)
    }

    throw errors[errors.length - 1]
  }
}
