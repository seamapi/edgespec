import { createWithEdgeSpec } from "../../../src"
import type { Middleware } from "../../../src/middleware"

const sampleMiddleware: Middleware<{}, { middlewareType: string }> = (
  req,
  ctx,
  next
) => {
  if (!req.middlewareType) {
    req.middlewareType = "uninjected"
  }

  return next(req, ctx)
}

export const withRouteSpec = createWithEdgeSpec({
  globalMiddlewares: [sampleMiddleware],
  authMiddlewareMap: {},
  apiName: "Example",
  productionServerUrl: "https://example.com",
})
