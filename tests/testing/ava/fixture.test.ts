import test from "ava"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { getTestServer } from "src/testing/ava/fixture"

test("AVA fixture works", async (t) => {
  const { port } = await getTestServer(t, {
    rootDirectory: path.dirname(fileURLToPath(import.meta.url)),
  })

  const healthResponse = await fetch(`http://localhost:${port}/health`)
  t.is(healthResponse.status, 200)
  t.is(await healthResponse.text(), "OK")
})
