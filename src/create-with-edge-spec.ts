import { z } from "zod"
import type { GlobalSpec } from "./types/global-spec.js"
import { Middleware, MiddlewareChain } from "./middleware/types.js"
import { CreateWithRouteSpecFn, RouteSpec } from "./types/route-spec.js"
import {
  EdgeSpecMultiPartFormDataResponse,
  EdgeSpecJsonResponse,
  EdgeSpecRequest,
  EdgeSpecResponse,
  EdgeSpecRouteFn,
  EdgeSpecCustomResponse,
  SerializableToResponse,
  mergeResponses,
} from "./types/web-handler.js"
import { withMethods } from "./middleware/with-methods.js"
import { withInputValidation } from "./middleware/with-input-validation.js"
import { withUnhandledExceptionHandling } from "./middleware/with-unhandled-exception-handling.js"
import { ResponseValidationError } from "./middleware/http-exceptions.js"
import { DEFAULT_CONTEXT } from "./types/context.js"

export const createWithEdgeSpec = <const GS extends GlobalSpec>(
  globalSpec: GS
): CreateWithRouteSpecFn<GS> => {
  return (routeSpec) => (routeFn) => async (request) => {
    const onMultipleAuthMiddlewareFailures =
      globalSpec.onMultipleAuthMiddlewareFailures ??
      routeSpec.onMultipleAuthMiddlewareFailures

    const supportedAuthMiddlewares = new Set<string>(
      routeSpec.auth == null || routeSpec.auth === "none"
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
        // Injected into the VM when running in WinterCG emulation mode
        // @ts-expect-error
        ...(typeof _injectedEdgeSpecMiddlewares !== "undefined"
          ? // @ts-expect-error
            _injectedEdgeSpecMiddlewares
          : []),
        withUnhandledExceptionHandling,
        serializeResponse(globalSpec, routeSpec, false),
        ...globalSpec.globalMiddlewares,
        firstAuthMiddlewareThatSucceeds(
          authMiddlewares,
          onMultipleAuthMiddlewareFailures
        ),
        ...(globalSpec.globalMiddlewaresAfterAuth ?? []),
        ...(routeSpec.middlewares ?? []),
        withMethods(routeSpec.methods),
        withInputValidation({
          supportedArrayFormats: globalSpec.supportedArrayFormats ?? [
            "brackets",
            "comma",
            "repeat",
          ],
          commonParams: routeSpec.commonParams,
          formData: routeSpec.multiPartFormData,
          jsonBody: routeSpec.jsonBody,
          queryParams: routeSpec.queryParams,
          routeParams: routeSpec.routeParams,
          urlEncodedFormData: routeSpec.urlEncodedFormData,
          shouldValidateGetRequestBody: globalSpec.shouldValidateGetRequestBody,
        }),
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
function serializeResponse(
  globalSpec: GlobalSpec,
  routeSpec: RouteSpec<any>,
  skipValidation: boolean = false
): Middleware {
  return async (next, req) => {
    const rawResponse = await next(req)

    const statusCode =
      rawResponse instanceof EdgeSpecResponse
        ? rawResponse.statusCode()
        : rawResponse.status

    const isSuccess = statusCode >= 200 && statusCode < 300

    try {
      const response = serializeToResponse(
        isSuccess &&
          !skipValidation &&
          (globalSpec.shouldValidateResponses ?? true),
        routeSpec,
        rawResponse
      )

      return mergeResponses(req.responseDefaults, response)
    } catch (err: any) {
      throw new ResponseValidationError(
        "the response does not match with jsonResponse",
        err
      )
    }
  }
}

export async function wrapMiddlewares(
  middlewares: MiddlewareChain,
  routeFn: EdgeSpecRouteFn<any, any, any>,
  request: EdgeSpecRequest
) {
  return await middlewares.reduceRight(
    (next, middleware) => {
      return async (req) => {
        return middleware(next, req)
      }
    },
    async (request: EdgeSpecRequest) => routeFn(request, DEFAULT_CONTEXT)
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

    if (response instanceof EdgeSpecMultiPartFormDataResponse) {
      return response.serializeToResponse(
        routeSpec.multipartFormDataResponse ?? z.any()
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
