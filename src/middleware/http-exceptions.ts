import { z } from "zod"

export interface HttpException {
  status: number
  message?: string

  _isHttpException: true
}

export abstract class EdgeSpecMiddlewareError
  extends Error
  implements HttpException
{
  _isHttpException = true as const

  constructor(
    public message: string,
    public status: number = 500
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export class MethodNotAllowedError extends EdgeSpecMiddlewareError {
  constructor(allowedMethods: readonly string[]) {
    super(`only ${allowedMethods.join(",")} accepted`, 405)
  }
}

export abstract class BadRequestError extends EdgeSpecMiddlewareError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class InvalidQueryParamsError extends BadRequestError {
  constructor(message: string) {
    super(message)
  }
}

export class InvalidContentTypeError extends BadRequestError {
  constructor(message: string) {
    super(message)
  }
}

export class InputParsingError extends BadRequestError {
  constructor(message: string) {
    super(message)
  }
}

export class InputValidationError extends BadRequestError {
  constructor(
    message: string,
    public error?: z.ZodError<any>
  ) {
    super(message)
  }
}

export class ResponseValidationError extends EdgeSpecMiddlewareError {
  constructor(
    message: string,
    public error?: z.ZodError<any>
  ) {
    super(message, 500)
  }
}
