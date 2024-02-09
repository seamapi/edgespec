import { createWithEdgeSpec } from "../../../src"
import type { Middleware } from "../../../src/middleware"

const sampleMiddleware: Middleware<{}, { middlewareType: string }> = (
  next,
  req
) => {
  if (!req.middlewareType) {
    req.middlewareType = "uninjected"
  }

  return next(req)
}

export const withRouteSpec = createWithEdgeSpec({
  globalMiddlewares: [sampleMiddleware],
  authMiddlewareMap: {},
  apiName: "Example",
  productionServerUrl: "https://example.com",
})
