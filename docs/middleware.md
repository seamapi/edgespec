# Middleware

Middleware in EdgeSpec follows a similar pattern to other libraries like Express/Fastify/Koa. Middleware receives three parameters: the incoming `req` object, the `ctx` context object, and the `next` function. It is expected to always call `next`.

Here's a few example use cases:

### Adding context to the request object

Mutate the passed `req` object. For example:

```typescript
import type { Middleware } from "edgespec"

export const exampleMiddleware: Middleware = (req, ctx, next) => {
  req.foo = "bar"
  return next(req, ctx)
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

Set the property `responseDefaults` on the `req` object. This can be a full `Response` instance or the options normally passed to the second argument of `new Response()`. For example:

```typescript
import type { Middleware } from "edgespec"

const baseResponse = new Response(null, {
  headers: {
    Server: "edgespec",
  },
})

export const exampleMiddleware: Middleware = (req, ctx, next) => {
  req.responseDefaults = baseResponse
  return next(req, ctx)
}
```

### Returning a response early [Soon]

## Notes

**All** middleware runs **before** EdgeSpec's internal input validation middleware, which means that properties like `req.jsonBody` are not available in middleware. Instead, use the `req.unvalidated*` variants, e.g. `req.unvalidatedJsonBody`. These properties have not been validated or transformed by Zod, but are available for use in middleware.

## Advanced typing

The `Middleware` type accepts two type parameters: the first is the additional context required on the incoming `Request` object, and the second is the output context that the middleware will return. Both are optional, but specifying the input context is very helpful when you have middlewares that depend on each other. For example:

```typescript
import type { Middleware } from "edgespec"

export const databaseMiddleware: Middleware<
  {},
  {
    db: DatabaseClient
  }
> = async (req, ctx, next) => {
  const db = await connectToDatabase()
  req.db = db
  return next(req, ctx)
}

export const bearerAuthMiddleware: Middleware<
  // Required request options (Middleware "input"). Assumes that the database middleware has already been called, maybe as part of `beforeAuthMiddleware[]` in `createWithEdgeSpec`.
  {
    db: DatabaseClient
  },
  // Result request options (Middleware "output")
  {
    is_authenticated: boolean
  }
> = (req, ctx, next) => {
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

  req.is_authenticated = Boolean(user)

  return next(req, ctx)
}
```

## Authentication Middleware

Authentication middleware is just like any other middleware, except by passing it to `authMiddleware` in `createWithEdgeSpec`, you can specify it as a valid `auth` option on a route. Using the `auth` option is usually simpler and will also affect code generation.

For example:

```ts
// src/use-edge-spec.ts
import { createWithEdgeSpec } from "edgespec"
import { withApiKey, withBrowserSession } from "src/middlewares"

export const withEdgeSpec = createWithEdgeSpec({
  apiName: "hello-world",

  authMiddleware: {
    apiKey: withApiKey,
    browserSession: withBrowserSession,
  },
  beforeAuthMiddleware: [],

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
