import { z } from "zod"
import { withEdgeSpec } from "../with-edge-spec.js"

export default withEdgeSpec({
  auth: "none",
  methods: ["GET"],
  queryParams: z.object({
    foo_id: z.string().uuid(),
  }),
})((req) => {
  return Response.json({})
})
