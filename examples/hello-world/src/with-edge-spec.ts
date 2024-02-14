import { createWithEdgeSpec } from "dist"
import { withDefaultExceptionHandling } from "dist/middleware"

export const withEdgeSpec = createWithEdgeSpec({
  apiName: "hello-world",
  productionServerUrl: "https://example.com",

  authMiddlewares: {},
  beforeAuthMiddlewares: [withDefaultExceptionHandling],
})
