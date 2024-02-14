import { createWithEdgeSpec } from "../../../src"

export const withRouteSpec = createWithEdgeSpec({
  beforeAuthMiddlewares: [],
  authMiddlewares: {},
  apiName: "Example",
  productionServerUrl: "https://example.com",
})
