import type { FetchEvent } from "@edge-runtime/primitives"
import { EdgeSpecRouteBundle } from "./edge-spec"
import { Primitive } from "type-fest"
import formurlencoded, { type FormEncodedOptions } from "form-urlencoded"
import { z } from "zod"

export type EdgeSpecRouteParams = {
  [routeParam: string]: string | string[]
}

export type HeadersDescriptor = Headers | HeadersInit

export type ResponseDescriptor =
  | Response
  | SerializableToResponse
  | (Omit<ResponseInit, "headers"> & {
      body?: Response["body"]
      headers?: HeadersDescriptor
    })

export interface EdgeSpecMiddlewareOptions {
  responseDefaults?: ResponseDescriptor
}

export interface EdgeSpecRequestOptions extends EdgeSpecMiddlewareOptions {
  edgeSpec: EdgeSpecRouteBundle
  pathParams?: EdgeSpecRouteParams
}

export type WithEdgeSpecRequestOptions<T> = T & EdgeSpecRequestOptions

export type EdgeSpecRequest<T = {}> = WithEdgeSpecRequestOptions<Request> & T

export interface SerializableToResponse {
  /**
   *  Serialize the response to a Response object
   *
   * @throws z.ZodError if the response does not match the schema
   * @param schema - the schema to validate the response against
   */
  serializeToResponse(schema: z.ZodTypeAny): Response
}

export type ValidFormDataValue = Primitive | Blob

export abstract class EdgeSpecResponse implements SerializableToResponse {
  abstract serializeToResponse(schema: z.ZodTypeAny): Response

  status(status: number): this {
    this.options.status = status
    return this
  }

  header(key: string, value: string): this {
    this.options.headers = mergeHeaders(this.options.headers, {
      [key]: value,
    })

    return this
  }

  headers(headers: HeadersInit): this {
    this.options.headers = mergeHeaders(this.options.headers, headers)
    return this
  }

  statusText(statusText: string): this {
    this.options.statusText = statusText
    return this
  }

  constructor(protected options: ResponseInit = {}) {}

  static json<T>(
    ...args: ConstructorParameters<typeof EdgeSpecJsonResponse<T>>
  ) {
    return new EdgeSpecJsonResponse<T>(...args)
  }

  static multipartFormData<T extends Record<string, ValidFormDataValue>>(
    ...args: ConstructorParameters<typeof EdgeSpecFormDataResponse<T>>
  ) {
    return new EdgeSpecFormDataResponse<T>(...args)
  }

  static urlEncodedFormData<T extends Record<string, any>>(
    ...args: ConstructorParameters<typeof EdgeSpecUrlEncodedResponse<T>>
  ) {
    return new EdgeSpecUrlEncodedResponse<T>(...args)
  }

  static custom<T, const C extends string>(
    ...args: ConstructorParameters<typeof EdgeSpecCustomResponse<T, C>>
  ) {
    return new EdgeSpecCustomResponse<T, C>(...args)
  }
}

export class EdgeSpecJsonResponse<T> extends EdgeSpecResponse {
  constructor(
    public data: T,
    options: ResponseInit = {}
  ) {
    super(options)
    this.options.headers = mergeHeaders(this.options.headers, {
      "Content-Type": "application/json",
    })
  }

  override serializeToResponse(schema: z.ZodTypeAny) {
    return new Response(JSON.stringify(schema.parse(this.data)), this.options)
  }
}

export class EdgeSpecCustomResponse<
  T,
  const C extends string,
> extends EdgeSpecResponse {
  constructor(
    public data: T,
    public contentType: C,
    options: ResponseInit = {}
  ) {
    super(options)
    this.options.headers = mergeHeaders(this.options.headers, {
      "Content-Type": contentType,
    })
  }

  serializeToResponse(schema: z.ZodTypeAny) {
    return new Response(schema.parse(this.data), this.options)
  }
}

export class MiddlewareResponseData extends EdgeSpecResponse {
  constructor(options: ResponseInit = {}) {
    super(options)
  }

  serializeToResponse() {
    return new Response(undefined, this.options)
  }
}

export class EdgeSpecFormDataResponse<
  T extends Record<string, ValidFormDataValue>,
> extends EdgeSpecResponse {
  constructor(
    public data: T,
    options: ResponseInit = {}
  ) {
    super(options)
    this.options.headers = mergeHeaders(this.options.headers, {
      "Content-Type": "multipart/form-data",
    })
  }

  serializeToResponse(schema: z.ZodTypeAny) {
    const formData = new FormData()

    for (const [key, value] of Object.entries(schema.parse(this.data))) {
      // TODO: nested objects?
      formData.append(key, value instanceof Blob ? value : String(value))
    }

    return new Response(formData, this.options)
  }
}

export class EdgeSpecUrlEncodedResponse<
  T extends Record<string, any>,
> extends EdgeSpecResponse {
  constructor(
    public data: T,
    options: ResponseInit = {},
    private encodingOptions?: FormEncodedOptions
  ) {
    super(options)
    this.options.headers = mergeHeaders(this.options.headers, {
      "Content-Type": "application/x-www-form-urlencoded",
    })
  }

  serializeToResponse(schema: z.ZodTypeAny) {
    return new Response(
      formurlencoded(schema.parse(this.data), this.encodingOptions),
      this.options
    )
  }
}

export type EdgeSpecRouteFn<
  RequestOptions = {},
  ResponseType extends SerializableToResponse | Response = Response,
> = (
  req: EdgeSpecRequest<RequestOptions>
) => ResponseType | Promise<ResponseType>

export type EdgeSpecFetchEvent = FetchEvent & {
  request: EdgeSpecRequest
}

export function createEdgeSpecRequest(
  request: Request,
  options: EdgeSpecRequestOptions
): EdgeSpecRequest {
  return Object.assign(request, options)
}

export function setEdgeSpecRequestOptions<RequestOptions>(
  request: EdgeSpecRequest,
  options: RequestOptions & EdgeSpecMiddlewareOptions
): EdgeSpecRequest<RequestOptions> {
  const r = Object.assign(request, {
    ...options,
    responseDefaults: mergeResponses(
      request.responseDefaults,
      options.responseDefaults
    ),
  })

  return r
}

export function mergeHeaders(
  h1: HeadersDescriptor | undefined | null,
  h2: HeadersDescriptor | undefined | null
) {
  return new Headers(
    Object.fromEntries([
      ...(h1 instanceof Headers
        ? h1
        : new Headers(h1 ?? undefined).entries() ?? []),
      ...(h2 instanceof Headers
        ? h2
        : new Headers(h2 ?? undefined).entries() ?? []),
    ])
  )
}

/**
 * Merge two responses together, with r2 overriding properties in r1
 *
 * This will merge the body, headers, status, and statusText of the two
 * responses
 */
export function mergeResponses(
  r1: ResponseDescriptor | SerializableToResponse | undefined | null,
  r2: ResponseDescriptor | SerializableToResponse | undefined | null
): Response {
  if (r1 && "serializeToResponse" in r1) r1 = r1.serializeToResponse(z.any())
  if (r2 && "serializeToResponse" in r2) r2 = r2.serializeToResponse(z.any())

  return new Response(r2?.body ?? r1?.body, {
    headers: mergeHeaders(r1?.headers, r2?.headers),
    status: r2?.status ?? r1?.status,
    statusText: r2?.statusText ?? r1?.statusText,
  })
}
