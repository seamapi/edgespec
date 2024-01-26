import { z } from "zod"
import { placeholderWithRouteSpec } from "../placeholder-route-spec"

export default placeholderWithRouteSpec({
  methods: ["GET", "POST"],
  jsonBody: z.object({
    foo_id: z.string().uuid(),
  }),
  jsonResponse: z.object({
    foo: z.object({
      id: z.string().uuid(),
      name: z.string(),
    }),
  }),
})((req) => {
  return Response.json({
    foo: {
      id: "example-id",
      name: "foo",
    },
  })
})
