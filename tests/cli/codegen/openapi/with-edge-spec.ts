import { createWithEdgeSpec } from "../../../../src/index.js"

export const withEdgeSpec = createWithEdgeSpec({
  openapi: {
    apiName: "openapi-example",
    productionServerUrl: "https://example.com",
  },
  authMiddleware: {},
  beforeAuthMiddleware: [],
})
