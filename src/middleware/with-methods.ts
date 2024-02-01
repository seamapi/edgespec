import { Middleware } from "src/types/middleware"
import { HTTPMethods } from "src/types/web-handler"
import { MethodNotAllowedException } from "./http-exceptions"

export const withMethods =
  (methods: readonly HTTPMethods[]): Middleware =>
  (next, req) => {
    if (!(methods as string[]).includes(req.method)) {
      throw new MethodNotAllowedException({
        type: "method_not_allowed",
        message: `only ${methods.join(",")} accepted`,
      })
    }

    return next(req)
  }
