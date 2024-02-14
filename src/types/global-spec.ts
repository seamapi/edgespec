import type { z } from "zod"
import { Middleware } from "../middleware/types"
import {
  EdgeSpecRequest,
  EdgeSpecRouteFn,
  SerializableToResponse,
} from "./web-handler"
import { InferRecordKey } from "./util"
import type { SecuritySchemeObject } from "openapi3-ts/oas31"

export type QueryArrayFormat = "brackets" | "comma" | "repeat"
export type QueryArrayFormats = readonly QueryArrayFormat[]

export type GlobalSpec = {
  authMiddlewareMap: Record<string, Middleware<any, any>>
  globalMiddlewares: readonly Middleware<unknown, unknown, {}>[]
  globalMiddlewaresAfterAuth?: readonly Middleware<any, any>[]

  // These improve OpenAPI generation
  apiName: string
  productionServerUrl: string

  addOkStatus?: boolean

  shouldValidateResponses?: boolean
  shouldValidateGetRequestBody?: boolean
  securitySchemas?: Record<string, SecuritySchemeObject>
  readonly globalSchemas?: Record<string, z.ZodTypeAny>

  supportedArrayFormats?: QueryArrayFormats

  /**
   * If an endpoint accepts multiple auth methods and they all fail, this hook will be called with the errors thrown by the middlewares.
   * You can inspect the errors and throw a more generic error in this hook if you want.
   */
  onMultipleAuthMiddlewareFailures?: (errors: unknown[]) => void
}

export type GetAuthMiddlewaresFromGlobalSpec<GS extends GlobalSpec> =
  InferRecordKey<GS["authMiddlewareMap"]>
