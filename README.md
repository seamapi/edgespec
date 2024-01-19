# edgespec

EdgeSpec is an opinionated HTTP framework. Out of the box, it:

- Uses filepath-based routing
- Generates ergonomic SDKs across multiple languages
- Generates OpenAPI documentation
- Provides end-to-end type safety for your middleware and endpoints
- Can serve other EdgeSpec services as an embedded module

EdgeSpec primarily targets the [common minimum API described by WinterCG](https://github.com/wintercg/proposal-common-minimum-api), but it can also target Node.js, Bun, and Deno. Currently, the two main "edge"/WinterCG-compatible platforms targeted are Cloudflare Workers and Vercel Edge Functions.

Regardless of your target, EdgeSpec provides a consistent API as well as test fixtures that simulate your target environment.

## Getting Started

```
npm install edgespec

npx edgespec serve
```

## Usage

Every edgespec project has a global configuration defined in what is normally
called `with-edge-spec.ts` and a route specification which is inside of each
route file and uses the `withEdgeSpec` wrapper. You can see examples of this
inside of the [examples directory](./examples), but here's a basic version:

```ts
// src/with-edge-spec.ts
import { createWithEdgeSpec } from "src/create-with-edge-spec"

export const withEdgeSpec = createWithEdgeSpec({
  apiName: "hello-world",

  authMiddlewareMap: {},
  globalMiddlewares: [],

  productionServerUrl: "https://example.com",
})
```

```ts
// api/index.ts
import { withEdgeSpec } from "../src/with-edge-spec"
import { z } from "zod"

export default withEdgeSpec({
  auth: "none",
  methods: ["POST"],
  jsonBody: z.object({
    a: z.number(),
    b: z.number(),
  }),
  jsonResponse: z.object({
    sum: z.number(),
  }),
})((req) => {
  const { a, b } = await req.json()

  return new Response(
    JSON.stringify({
      sum: a + b,
    })
  )
})
```

EdgeSpec requires a config file called `edgespec.config.ts` or `edgespec.config.js` to be placed next to your routes directory:

```ts
import { defineConfig } from "edgespec"

export default defineConfig({
  emulateWinterCGRuntimeLocally: true,
  outDir: "dist",
})
```

## Deployment

Run `edgespec bundle`. Then, depending on your target:

### Node.js

Create an `entrypoint.js` file:

```js
import { startServer } from "edgespec/adapters/node"
import bundle from "./dist"

startServer(bundle, { port: 3000 })
```

### WinterCG (Cloudflare Workers/Vercel Edge Functions)

Create an `entrypoint.js` file:

```js
import { addFetchListener } from "edgespec/adapters/wintercg-minimal"
import bundle from "./dist"
addFetchListener(edgeSpec)
```

Because WinterCG doesn't allow `import`s, you'll need to bundle a second time with a tool like [tsup](https://github.com/egoist/tsup): `tsup entrypoint.js`. You can bypass this step by running `edgespec bundle --entrypoint wintercg-minimal` and directly deploying `./dist/index.js` if you don't plan on embedding it into other services.

## Embedding in other frameworks

todo: talk about how something like this works:

```ts
import { Hono } from "hono"
import { createHonoHandler } from "edgespec/adapters/hono"
import entry from "./dist/bundled-edgespec-app.js"

const app = new Hono()
app.use("/foo_service/*", createHonohandler(entry))
```

## Defining Routes

## Defining Global Configuration

## Middleware System

Use or release edgespec-compatible middleware with a proper type-pipeline:

```typescript
import type { Middleware } from "edgespec"
export const someMiddleware: Middleware<{
  deps: {
    db: DatabaseClient
  },
  outputs: {
    is_authenticated: boolean
  }
> = next => (req) => {

  const authToken = req.headers.get("authorization")?.split("Bearer ")?.[1]
  if (!authToken) {
    req.is_authenticated = false
    return next(req)
  }

  const [user] = req.db.query("SELECT * FROM users WHERE token=?", [authToken])

  if (!user) {
    req.is_authenticated = false
    return next(req)
  }

  req.is_authenticated = true
  return next(req)
}
```

## Authentication Middleware

You can specify authentication middleware, this middleware can be easily invoked
by specifying `auth` on an route specifications.

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

## Using as a module

> Having a service compiled as a module is called the "Module Service" pattern

If you use `edgespec build module`, you can compile your
edgespec app into an easy-to-use importable module. This
allows you to use your application as if it's a library
without ever starting a server.

```ts
// Create module.ts using "edgespec build module"
import * as ModuleService from "./module.ts"

const myModuleService = ModuleService.create()

const res = await myModuleServer.fetch("/health").then((r) => r.json())

console.log(res)
// { "ok": true }
```

## Proxying Requests to other Module Services

```ts
// routes/billing/[...anything].ts
import { withEdgeSpec } from "src/with-edge-spec"
import BillingService from "billing-service"

export default withEdgeSpec({
  auth: "apiKey",
})(async (req) => {
  return BillingService.create().fetch(req)
})
```

## Building for Deployment

You can build configurations for different frameworks so that your edgespec app
is portable. For example:

- `edgespec build next` - Creates appropriate `app` or `pages/api` directory OR modifies `next.config.js`
- `edgespec build hono` - Creates a `hono-app.ts` file that contains all the routes
- `edgespec build bun` - Creates a `bun-app.ts` file that contains all the routes
- `edgespec build deno` - Creates a `deno-app.ts` file that contains all the routes
- `edgespec build module` - Creates a `module.ts` file that contains all the routes and can be used programmatically

## Building OpenAPI

You can use `edgespec generate openapi` to generate an
`openapi.json` file. You may want to specify the location of this file to
`public/openapi.json` or somewhere where it can be utilized by your server.

This file is served by default at `<server-url>/openapi.json` when you run
`edgespec serve`

## File-Routing

By default, `edgespec` searches inside your `./routes` directory for endpoints
using the NextJS `pages/api` file routing standard. It looks a bit like this:

- `/routes/health.ts`
- `/routes/resource/[id].ts`
- `/routes/resource/[id]/actions/[...action].ts`

## Linting

You can use `edgespec lint` to check that all your endpoints are well-formed
and follow a configurable naming convention (e.g. `snake_case` or `kebab-case`)

## Development

The types are separated from the source javascript files in this project,
eliminating the need for a transpiler. This was done because the types present
a significant amount of complexity, so we intentionally separated the
implementation from the types.

You can run the tests with ava, to run a specific test file use:

```bash
npx ava ./tests/endpoints/basic.test.ts
```

To run the entire test suite use `npm run test`
