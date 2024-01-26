import { withEdgeSpec } from "../src/with-edge-spec"

export default withEdgeSpec({
  auth: "none",
  method: ["GET"],
})((req) => {
  return new Response("Hello world!")
})
