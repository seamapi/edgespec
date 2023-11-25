import { withEdgeSpec } from "../src/with-edge-spec"

export default withEdgeSpec({
  auth: "none",
})((req) => {
  return new Response("Hello world!")
})
