import { Middleware } from "src/middleware/types.ts"
import { HTTPMethods } from "src/types/web-handler.ts"
import { MethodNotAllowedError } from "./http-exceptions.ts"

export const withMethods =
  (methods: readonly HTTPMethods[]): Middleware =>
  (req, ctx, next) => {
    if (!(methods as string[]).includes(req.method)) {
      throw new MethodNotAllowedError(methods)
    }

    return next(req, ctx)
  }
