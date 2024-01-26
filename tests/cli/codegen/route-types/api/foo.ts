import { z } from "zod"
import { placeholderWithRouteSpec } from "../placeholder-route-spec"

export const jsonResponse = z.object({
  foo: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
})

export default placeholderWithRouteSpec({
  methods: ["GET", "POST"],
  jsonBody: z.object({
    foo_id: z.string().uuid(),
  }),
  jsonResponse,
})((req) => {
  return Response.json({
    foo: {
      id: "example-id",
      name: "foo",
    },
  })
})
