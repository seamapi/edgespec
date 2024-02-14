# Routes

Each API route is defined in a separate file within a specific directory (by default, `./api`). Here's an example:

```ts
// api/index.ts
import { withEdgeSpec } from "../with-edge-spec"
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
})((req, ctx) => {
  const { a, b } = await req.jsonBody

  return ctx.json({
    sum: a + b,
  })
})
```

[Zod](https://github.com/colinhacks/zod) is used for validation. By default, **both** input and output (`Response.json()`) are validated against the provided schemas. See the docs on [`createWithEdgeSpec()`](./global-route-config.md) if you want to disable this.

## File routing

EdgeSpec loosely follows Next.js's route convention. For example:

- `/api/health.ts` -> `GET /health`
- `/api/resource/[id].ts` -> `GET /resource/:id`
- `/api/resource/[id]/actions/[...action].ts` -> `GET /resource/:id/actions/:action*`

Path parameters are automatically parsed and added to the `req.pathParams` object.
