import crypto from "node:crypto"
import { withRouteSpec } from "../with-route-spec.ts"
import * as pg from "pg"

export default withRouteSpec({
  methods: ["GET"],
  auth: "none",
})(() => {
  const pool = new pg.default.Pool()
  return new Response(crypto.randomBytes(16).toString("hex"))
})
