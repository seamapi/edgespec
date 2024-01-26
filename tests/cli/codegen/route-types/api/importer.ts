import { placeholderWithRouteSpec } from "../placeholder-route-spec"
import { jsonResponse } from "./foo"

export default placeholderWithRouteSpec({
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
