import { withRouteSpec } from "../with-route-spec.js"

export default withRouteSpec({
  methods: ["GET"],
  auth: "none",
})((req) => {
  return new Response(req.middlewareType)
})
