import { withRouteSpec } from "../with-route-spec.ts"

export default withRouteSpec({
  methods: ["GET"],
  auth: "none",
})((req, ctx) => {
  return new Response((ctx as any).foo)
})
