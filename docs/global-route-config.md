# Global route config

Every EdgeSpec project has a global wrapper defined in a file often called `with-edge-spec.ts`. This defines things like:

- Authentication methods
- Global middlewares
- Metadata for code generation

Here's an example:

```ts
// src/with-edge-spec.ts
import { createWithEdgeSpec } from "edgespec"

export const withEdgeSpec = createWithEdgeSpec({
  apiName: "hello-world",

  authMiddlewareMap: {},
  globalMiddlewares: [],

  productionServerUrl: "https://example.com",
})
```
