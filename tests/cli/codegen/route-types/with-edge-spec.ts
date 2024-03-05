import { createWithEdgeSpec } from "../../../../src/index.js"

export const withEdgeSpec = createWithEdgeSpec({
  apiName: "hello-world",
  productionServerUrl: "https://example.com",
  authMiddleware: {},
  beforeAuthMiddleware: [],
})
