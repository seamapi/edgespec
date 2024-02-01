import { Middleware } from "src/types/middleware"
import { HTTPMethods } from "src/types/web-handler"
import { MethodNotAllowedError } from "./http-exceptions"

export const withMethods =
  (methods: readonly HTTPMethods[]): Middleware =>
  (next, req) => {
    if (!(methods as string[]).includes(req.method)) {
      throw new MethodNotAllowedError(methods)
    }

    return next(req)
  }
