import crypto from "node:crypto"
import { withRouteSpec } from "../with-route-spec.ts"
import { Pool } from "pg"

export default withRouteSpec({
  methods: ["GET"],
  auth: "none",
})(() => {
  const pool = new Pool()
  return new Response(crypto.randomBytes(16).toString("hex"))
})
