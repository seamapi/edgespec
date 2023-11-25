import { createWithEdgeSpec } from "src/create-with-edge-spec"

export const withEdgeSpec = createWithEdgeSpec({
  apiName: "hello-world",

  authMiddlewareMap: {},
  globalMiddlewares: [],

  productionServerUrl: "https://example.com",
})
