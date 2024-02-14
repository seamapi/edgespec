import { withRouteSpec } from "../with-route-spec"

export default withRouteSpec({
  methods: ["GET"],
  auth: "none",
})((req) => {
  return new Response((req as any).foo)
})
