import { z } from "zod"
import { createWithEdgeSpec } from "../../../../src"

export const withEdgeSpec = createWithEdgeSpec({
  apiName: "hello-world",
  productionServerUrl: "https://example.com",
  authMiddlewares: {},
  beforeAuthMiddlewares: [],
})
