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
