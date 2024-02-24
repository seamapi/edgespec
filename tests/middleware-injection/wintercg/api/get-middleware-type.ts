import { withRouteSpec } from "../with-route-spec.js"

export default withRouteSpec({
  methods: ["GET"],
  auth: "none",
})((req, ctx) => {
  return new Response(ctx.middlewareType)
})
