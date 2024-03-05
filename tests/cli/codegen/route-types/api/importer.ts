import { withEdgeSpec } from "../with-edge-spec.js"
import { jsonResponse } from "./foo.js"

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
