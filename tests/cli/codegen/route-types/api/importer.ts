import { withEdgeSpec } from "../with-edge-spec"
import { jsonResponse } from "./foo"

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
