import crypto from "node:crypto"
import { withRouteSpec } from "../with-route-spec.ts"

export default withRouteSpec({
  methods: ["GET"],
  auth: "none",
})(() => {
  return new Response(crypto.randomBytes(16).toString("hex"))
})
