import { z, ZodError } from "zod"

import type { QueryArrayFormats } from "src/types/global-spec.js"
import { Middleware } from "src/middleware/index.js"
import {
  BadRequestError,
  InputParsingError,
  InputValidationError,
  InvalidContentTypeError,
  InvalidQueryParamsError,
} from "./http-exceptions.js"

const unwrapSchema = (schema: z.core.$ZodType): z.core.$ZodType => {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodDefault) {
    return unwrapSchema(schema.unwrap())
  }
  if (schema instanceof z.ZodPipe) {
    return unwrapSchema(schema.in)
  }
  return schema
}

const tryGetZodSchemaAsObject = (
  schema: z.ZodType<any>
): z.ZodObject<any> | undefined => {
  const unwrappedSchema = unwrapSchema(schema)
  return unwrappedSchema instanceof z.ZodObject ? unwrappedSchema : undefined
}

const isZodSchemaArray = (schema: z.ZodType<any>) =>
  unwrapSchema(schema) instanceof z.ZodArray

const isZodSchemaBoolean = (schema: z.ZodType<any>) =>
  unwrapSchema(schema) instanceof z.ZodBoolean

const parseQueryParams = <Schema extends z.ZodType<any>>(
  schema: Schema,
  input: Record<string, unknown>,
  supportedArrayFormats: QueryArrayFormats
): z.output<Schema> => {
  const parsed_input = Object.assign({}, input)
  const obj_schema = tryGetZodSchemaAsObject(schema)

  if (obj_schema) {
    for (const [key, value] of Object.entries(obj_schema.shape)) {
      if (isZodSchemaArray(value as z.ZodType<any>)) {
        const array_input = input[key]

        if (
          typeof array_input === "string" &&
          supportedArrayFormats.includes("comma")
        ) {
          parsed_input[key] = array_input.split(",")
        }

        const bracket_syntax_array_input = input[`${key}[]`]
        if (
          typeof bracket_syntax_array_input === "string" &&
          supportedArrayFormats.includes("brackets")
        ) {
          const pre_split_array = bracket_syntax_array_input
          parsed_input[key] = pre_split_array.split(",")
        }

        if (
          Array.isArray(bracket_syntax_array_input) &&
          supportedArrayFormats.includes("brackets")
        ) {
          parsed_input[key] = bracket_syntax_array_input
        }

        continue
      }

      if (isZodSchemaBoolean(value as z.ZodType<any>)) {
        const boolean_input = input[key]

        if (typeof boolean_input === "string") {
          parsed_input[key] = boolean_input === "true"
        }
      }
    }
  }

  return schema.parse(parsed_input)
}

const validateQueryParams = (
  inputUrl: string,
  schema: z.ZodType<any>,
  supportedArrayFormats: QueryArrayFormats
) => {
  const url = new URL(inputUrl, "http://dummy.com")

  const seenKeys = new Set<string>()

  const obj_schema = tryGetZodSchemaAsObject(schema)
  if (!obj_schema) {
    return
  }

  for (const key of url.searchParams.keys()) {
    for (const [schemaKey, value] of Object.entries(obj_schema.shape)) {
      if (isZodSchemaArray(value as z.ZodType<any>)) {
        if (
          key === `${schemaKey}[]` &&
          !supportedArrayFormats.includes("brackets")
        ) {
          throw new InvalidQueryParamsError(
            `Bracket syntax not supported for query param "${schemaKey}"`
          )
        }
      }
    }

    const key_schema = obj_schema.shape[key]

    if (key_schema) {
      if (isZodSchemaArray(key_schema)) {
        if (seenKeys.has(key) && !supportedArrayFormats.includes("repeat")) {
          throw new InvalidQueryParamsError(
            `Repeated parameters not supported for duplicate query param "${key}"`
          )
        }
      }
    }

    seenKeys.add(key)
  }
}

export interface RequestInput<
  JsonBody extends z.ZodType<any>,
  QueryParams extends z.ZodType<any>,
  CommonParams extends z.ZodType<any>,
  FormData extends z.ZodType<any>,
  UrlEncodedFormData extends z.ZodType<any>,
  RouteParams extends z.ZodType<any>,
> {
  jsonBody?: JsonBody
  queryParams?: QueryParams
  commonParams?: CommonParams
  formData?: FormData
  routeParams?: RouteParams
  urlEncodedFormData?: UrlEncodedFormData
  supportedArrayFormats: QueryArrayFormats
}

export const withInputValidation =
  <
    JsonBody extends z.ZodType<any>,
    QueryParams extends z.ZodType<any>,
    CommonParams extends z.ZodType<any>,
    FormData extends z.ZodType<any>,
    UrlEncodedFormData extends z.ZodType<any>,
    RouteParams extends z.ZodType<any>,
  >(
    input: RequestInput<
      JsonBody,
      QueryParams,
      CommonParams,
      FormData,
      UrlEncodedFormData,
      RouteParams
    >
  ): Middleware<
    {},
    {},
    {
      jsonBody: z.output<JsonBody>
      multiPartFormData: z.output<FormData>
      query: z.output<QueryParams>
      commonParams: z.output<CommonParams>
      urlEncodedFormData: z.output<UrlEncodedFormData>
    }
  > =>
  async (req, ctx, next) => {
    const { supportedArrayFormats } = input

    if (
      (input.formData && input.jsonBody) ||
      (input.formData && input.commonParams)
    ) {
      throw new Error("Cannot use formData with jsonBody or commonParams")
    }

    if (
      (req.method === "POST" || req.method === "PATCH") &&
      (input.jsonBody || input.commonParams) &&
      !req.headers.get("content-type")?.includes("application/json")
    ) {
      throw new InvalidContentTypeError(
        `${req.method} requests must have Content-Type header with "application/json"`
      )
    }

    if (
      input.urlEncodedFormData &&
      req.method !== "GET" &&
      !req.headers
        .get("content-type")
        ?.includes("application/x-www-form-urlencoded")
    ) {
      throw new InvalidContentTypeError(
        `Must have Content-Type header with "application/x-www-form-urlencoded"`
      )
    }

    if (
      input.formData &&
      (req.method === "POST" || req.method === "PATCH") &&
      !req.headers.get("content-type")?.includes("multipart/form-data")
    ) {
      throw new InvalidContentTypeError(
        `${req.method} requests must have Content-Type header with "multipart/form-data"`
      )
    }

    // TODO eventually we should support multipart/form-data

    const originalParams = Object.fromEntries(
      new URL(req.url).searchParams.entries()
    )

    let jsonBody: any

    if (input.jsonBody || input.commonParams) {
      try {
        jsonBody = await req.clone().json()
      } catch (e: any) {
        if (!input.jsonBody?.isOptional()) {
          throw new InputParsingError("Error while parsing JSON body")
        }
      }
    }

    let multiPartFormData = undefined

    if (input.formData) {
      try {
        multiPartFormData = await req.clone().formData()
        multiPartFormData = Object.fromEntries(multiPartFormData.entries())
      } catch (e: any) {
        if (!input.formData?.isOptional()) {
          throw new InputParsingError("Error while parsing form data")
        }
      }
    }

    let urlEncodedFormData = undefined

    if (input.urlEncodedFormData) {
      try {
        const params = new URLSearchParams(await req.clone().text())
        urlEncodedFormData = Object.fromEntries(params.entries())
      } catch (e: any) {
        if (!input.urlEncodedFormData?.isOptional()) {
          throw new InputParsingError(
            "Error while parsing url encoded form data"
          )
        }
      }
    }

    try {
      const originalCombinedParams = {
        ...originalParams,
        ...(typeof jsonBody === "object" ? jsonBody : {}),
      }

      const willValidateRequestBody = !["GET", "DELETE", "HEAD"].includes(
        req.method
      )

      if (input.formData && willValidateRequestBody) {
        req.multiPartFormData = input.formData.parse(multiPartFormData)
      }

      if (input.jsonBody && willValidateRequestBody) {
        req.jsonBody = input.jsonBody.parse(jsonBody)
      }

      if (input.urlEncodedFormData && willValidateRequestBody) {
        req.urlEncodedFormData =
          input.urlEncodedFormData.parse(urlEncodedFormData)
      }

      if (input.routeParams && "routeParams" in req) {
        req.routeParams = input.routeParams.parse(req.routeParams)
      }

      if (input.queryParams) {
        if (!req.url) {
          throw new Error("req.url is undefined")
        }

        validateQueryParams(req.url, input.queryParams, supportedArrayFormats)

        req.query = parseQueryParams(
          input.queryParams,
          originalParams,
          supportedArrayFormats
        )
      }

      if (input.commonParams) {
        /**
         * as commonParams includes query params, we can use the parseQueryParams function
         */
        req.commonParams = parseQueryParams(
          input.commonParams,
          originalCombinedParams,
          supportedArrayFormats
        )
      }
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        throw error
      }

      if (error instanceof ZodError) {
        throw new InputValidationError(error)
      }

      throw new InputParsingError("Error while parsing input")
    }

    return next(req, ctx)
  }
