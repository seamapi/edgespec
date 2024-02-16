import { withEdgeSpec } from "../with-edge-spec.ts"
import { jsonResponse } from "./foo.ts"

export default withEdgeSpec({
  auth: "none",
  methods: ["PUT"],
  jsonResponse,
})((req) => {
  return Response.json({
    foo: {
      id: "example-id",
      name: "foo",
    },
  })
})
