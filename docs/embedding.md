# Embedding as a module

You can embed an EdgeSpec service inside other applications.

For example, say you want to embed an API for ships in Star Wars inside an API for all things Star Wars:

```ts
// api/ships/[...modulePath].ts
import { withEdgeSpec } from "../with-edge-spec"
import { z } from "zod"

export default withEdgeSpec({
  auth: "none",
  methods: ["GET"],
})((req) => {
  // This is a thin wrapper over `await import()` to enable types, you can use `import()` directly if you want.
  const shipsApi = await loadBundle("@acme/star-wars-ships")

  return shipsApi.makeRequest(req, {
    // This is important so that the ships API sees the correct path.
    removePathnamePrefix: "/ships",
  })
})
```
