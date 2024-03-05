import { Middleware } from "src/middleware/types.js"
import { HTTPMethods } from "src/types/web-handler.js"
import { MethodNotAllowedError } from "./http-exceptions.js"

export const withMethods =
  (methods: readonly HTTPMethods[]): Middleware =>
  (req, ctx, next) => {
    if (!(methods as string[]).includes(req.method)) {
      throw new MethodNotAllowedError(methods)
    }

    return next(req, ctx)
  }
