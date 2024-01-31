# Middleware

EdgeSpec middleware likely works differently than what you might expect if you've used Express/Fastify/Koa. Middleware in EdgeSpec allows you to accomplish the same goals:

- add context to the request object
- modify the base HTTP response
- return a response early before it hits the route handler

However, it goes about this in a slightly different way. Middleware does not accept a `next` parameter to call the next middleware in the stack. Instead, middleware is called with only the request object and is expected to return a new object with additional context or options set.

### Adding context to the request object

Return an object with new properties from your middleware. For example:

```typescript
import type { Middleware } from "edgespec"

export const exampleMiddleware: Middleware = (req) => {
  return {
    foo: "bar",
  }
}

// Later, in a route...
withEdgeSpec({
  // ...
  middleware: [exampleMiddleware],
})(async (req) => {
  console.log(req.foo) // "bar"
})
```

### Modifying the base HTTP response

Return an object with the `responseDefaults` property set. This can be a full `Response` instance or the options normally passed to the second argument of `new Response()`. For example:

```typescript
import type { Middleware } from "edgespec"

const baseResponse = new Response(null, {
  headers: {
    Server: "edgespec",
  },
})

export const exampleMiddleware: Middleware = (req) => {
  return {
    responseDefaults: baseResponse,
  }
}
```

### Returning a response early [Soon]

## Advanced typing

The `Middleware` type accepts two type parameters: the first is the additional context required on the incoming `Request` object, and the second is the output context that the middleware will return. Both are optional, but specifying the input context is very helpful when you have middlewares that depend on each other. For example:

```typescript
import type { Middleware } from "edgespec"

export const databaseMiddleware: Middleware = async (req) => {
  const db = await connectToDatabase()

  return {
    db,
  }
}

export const bearerAuthMiddleware: Middleware<
  // Required request options (Middleware "input"). Assumes that the database middleware has already been called, maybe as part of `globalMiddlewares[]` in `createWithEdgeSpec`.
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
