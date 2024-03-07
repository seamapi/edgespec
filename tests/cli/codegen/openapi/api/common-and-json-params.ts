import { z } from "zod"
import { withEdgeSpec } from "../with-edge-spec.js"

export default withEdgeSpec({
  methods: ["GET", "POST"],
  commonParams: z.object({
    user_id: z.string(),
  }),
  jsonBody: z.object({
    action: z.enum(["create", "edit", "delete"]),
  }),
  jsonResponse: z.object({
    user_id: z.string(),
  }),
})(async (req, ctx) => {
  return ctx.json({
    user_id: req.commonParams.user_id,
  })
})
