import { createWithEdgeSpec } from "dist/esm"
import { withDefaultExceptionHandling } from "dist/esm/middleware"

export const withEdgeSpec = createWithEdgeSpec({
  apiName: "hello-world",
  productionServerUrl: "https://example.com",

  authMiddleware: {},
  beforeAuthMiddleware: [withDefaultExceptionHandling],
})
