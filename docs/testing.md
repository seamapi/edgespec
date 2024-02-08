# Testing

EdgeSpec aims to support all common test runners. If you don't see your test runner here, please open an issue.

EdgeSpec test fixtures run a local dev server, so it supports your test runner's watch mode out of the box.

For the examples below, assume that there is a single `/health` endpoint that returns `OK`.

## AVA

```typescript
import test from "ava"
import axios from "axios"
import { getTestServer } from "edgespec/testing/ava"

test("GET /health", async (t) => {
  const { port } = getTestServer(t)

  const healthResponse = await fetch(`http://localhost:${port}/health`)
  t.is(healthResponse.status, 200)
  t.is(await healthResponse.text(), "OK")
})
```
