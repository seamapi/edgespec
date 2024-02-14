import { createWithEdgeSpec } from "../../../src"

export const withRouteSpec = createWithEdgeSpec({
  globalMiddlewares: [],
  authMiddlewareMap: {},
  apiName: "Example",
  productionServerUrl: "https://example.com",
})
