import test from "ava"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { getTestServer } from "src/testing/ava/fixture.ts"

// TODO fix this test!
// Fails with:
// Unhandled exception:
// Error: Dynamic require of "events" is not supported
test.skip("pg can be used inside of edgespec", async (t) => {
  const { port } = await getTestServer(t, {
    rootDirectory: path.dirname(fileURLToPath(import.meta.url)),
  })

  const randomResponse = await fetch(`http://localhost:${port}/pg`)
  t.is(randomResponse.status, 200)
  t.is((await randomResponse.text()).length, 32)
})
