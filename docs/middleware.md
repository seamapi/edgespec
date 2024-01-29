# Middleware

Use or release EdgeSpec-compatible middleware with a proper type-pipeline:

```typescript
import type { Middleware } from "edgespec"
export const someMiddleware: Middleware<
  // Required request options (Middleware "input")
  {
    db: DatabaseClient
  },
  // Result request options (Middleware "output")
  {
    is_authenticated: boolean
  }
> = (req) => {
  const authToken = req.headers.get("authorization")?.split("Bearer ")?.[1]
  if (!authToken) {
    // EdgeSpec will attach returned properties to the Request object
    return {
      is_authenticated: false,
    }
  }

  const [user] = await req.db.query("SELECT * FROM users WHERE token=?", [
    authToken,
  ])

  return {
    is_authenticated: Boolean(user),
  }
}
```

## Authentication Middleware

Authentication middleware is just like any other middleware, except by passing it to `authMiddlewareMap` in `createWithEdgeSpec`, you can specify it as a valid `auth` option on a route. Using the `auth` option is usually simpler and will also affect code generation.

For example:

```ts
// src/use-edge-spec.ts
import { createWithEdgeSpec } from "edgespec"
import { withApiKey, withBrowserSession } from "src/middlewares"

export const withEdgeSpec = createWithEdgeSpec({
  apiName: "hello-world",

  authMiddlewareMap: {
    apiKey: withApiKey,
    browserSession: withBrowserSession,
  },
  globalMiddlewares: [],

  productionServerUrl: "https://example.com",
})
```

```ts
// routes/resource/list.ts
import { withEdgeSpec } from "src/with-edge-spec"

export default withEdgeSpec({
  auth: "apiKey",

  // you can also specify an array of methods, e.g. ["apiKey", "browserSession"]
  // auth: ["apiKey", "browserSession"],
})(async (req) => {
  // Recommendation: Have your auth middleware add req.auth to your request,
  // the type will carry over!
  const { userId } = req.auth

  // ...
})
```
