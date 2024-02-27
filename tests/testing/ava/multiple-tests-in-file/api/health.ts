import { withRouteSpec } from "../with-route-spec.ts"

export default withRouteSpec({
  methods: ["GET"],
  auth: "none",
})((req) => {
  return new Response("OK")
})
