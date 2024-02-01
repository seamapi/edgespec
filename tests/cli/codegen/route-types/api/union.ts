import { z } from "zod"
import { withEdgeSpec } from "../with-edge-spec.js"

export default withEdgeSpec({
  auth: "none",
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
