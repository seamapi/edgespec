import { createWithEdgeSpec } from "../../../../src/index.ts"

export const withEdgeSpec = createWithEdgeSpec({
  apiName: "hello-world",
  productionServerUrl: "https://example.com",
  authMiddleware: {},
  beforeAuthMiddleware: [],
})
