import type { Middleware } from "src/middleware/index.ts"
import {
  InputParsingError,
  InvalidContentTypeError,
} from "./http-exceptions.ts"

interface WithInputParsingOptions {
  hasJsonBody: boolean
  hasCommonParams: boolean
  hasUrlEncodedFormData: boolean
  hasFormData: boolean
}

export const withInputParsing =
  (
    options: WithInputParsingOptions
  ): Middleware<
    {},
    {
      unvalidatedJsonBody: any
      unvalidatedMultiPartFormData: any
      unvalidatedQuery: any
      unvalidatedUrlEncodedFormData: any
    }
  > =>
  async (req, ctx, next) => {
    if (
      (req.method === "POST" || req.method === "PATCH") &&
      (options.hasJsonBody || options.hasCommonParams) &&
      !req.headers.get("content-type")?.includes("application/json")
    ) {
      throw new InvalidContentTypeError(
        `${req.method} requests must have Content-Type header with "application/json"`
      )
    }

    if (
      options.hasUrlEncodedFormData &&
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
      options.hasFormData &&
      (req.method === "POST" || req.method === "PATCH") &&
      !req.headers.get("content-type")?.includes("multipart/form-data")
    ) {
      throw new InvalidContentTypeError(
        `${req.method} requests must have Content-Type header with "multipart/form-data"`
      )
    }

    if (options.hasJsonBody || options.hasCommonParams) {
      try {
        req.unvalidatedJsonBody = await req.clone().json()
      } catch (e: any) {
        throw new InputParsingError("Error while parsing JSON body")
      }
    }

    if (options.hasFormData) {
      try {
        const multiPartFormData = await req.clone().formData()
        req.unvalidatedMultiPartFormData = Object.fromEntries(
          multiPartFormData.entries()
        )
      } catch (e: any) {
        throw new InputParsingError("Error while parsing form data")
      }
    }

    if (options.hasUrlEncodedFormData) {
      try {
        const params = new URLSearchParams(await req.clone().text())
        req.unvalidatedUrlEncodedFormData = Object.fromEntries(params.entries())
      } catch (e: any) {
        throw new InputParsingError("Error while parsing url encoded form data")
      }
    }

    return next(req, ctx)
  }
