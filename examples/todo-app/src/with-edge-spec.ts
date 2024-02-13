import { createWithEdgeSpec } from "dist"
import { withDefaultExceptionHandling } from "dist/middleware"

export const withEdgeSpec = createWithEdgeSpec({
  apiName: "todo-app",
  productionServerUrl: "https://example.com",

  authMiddlewareMap: {},
  globalMiddlewares: [withDefaultExceptionHandling],
})
