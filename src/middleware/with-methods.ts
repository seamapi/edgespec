import { Middleware } from "src/middleware/types"
import { HTTPMethods } from "src/types/web-handler"
import { MethodNotAllowedError } from "./http-exceptions"

export const withMethods =
  (methods: readonly HTTPMethods[]): Middleware =>
  (req, ctx, next) => {
    if (!(methods as string[]).includes(req.method)) {
      throw new MethodNotAllowedError(methods)
    }

    return next(req, ctx)
  }
