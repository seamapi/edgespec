import { withEdgeSpec } from "../src/with-edge-spec"

export default withEdgeSpec({
  auth: "none",
  methods: ["GET"],
})((req) => {
  return new Response("Hello world!")
})
