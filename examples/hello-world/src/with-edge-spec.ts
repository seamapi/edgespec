import { createWithEdgeSpec } from "src/create-with-edge-spec"

export const withEdgeSpec = createWithEdgeSpec({
  apiName: "hello-world",
  productionServerUrl: "https://example.com",

  authMiddlewareMap: {},
  globalMiddlewares: [],
})
