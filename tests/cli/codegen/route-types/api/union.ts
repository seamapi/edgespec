import { z } from "zod"
import { placeholderWithRouteSpec } from "../placeholder-route-spec"

export default placeholderWithRouteSpec({
  methods: ["GET", "POST"],
  jsonBody: z.object({
    foo_id: z.string().uuid(),
  }),
  jsonResponse: z.union([
    z.object({
      foo_id: z.string(),
    }),
    z.boolean().array(),
  ]),
})((req) => {
  return Response.json({
    foo: {
      id: "example-id",
      name: "foo",
    },
  })
})
