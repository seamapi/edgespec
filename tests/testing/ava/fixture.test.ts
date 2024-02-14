import test from "ava"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { getTestServer } from "src/testing/ava/fixture"
import { Middleware } from "src/middleware"

test("AVA fixture works", async (t) => {
  const { port } = await getTestServer(t, {
    rootDirectory: path.dirname(fileURLToPath(import.meta.url)),
  })

  const healthResponse = await fetch(`http://localhost:${port}/health`)
  t.is(healthResponse.status, 200)
  t.is(await healthResponse.text(), "OK")
})

test("middleware is injected", async (t) => {
  const sampleMiddleware: Middleware<{}, { foo: "bar" }> = (req, ctx, next) => {
    req.foo = "bar"
    return next(req, ctx)
  }

  const { port } = await getTestServer(t, {
    rootDirectory: path.dirname(fileURLToPath(import.meta.url)),
    middlewares: [sampleMiddleware],
  })

  const healthResponse = await fetch(`http://localhost:${port}/middleware-test`)
  t.is(healthResponse.status, 200)
  t.is(await healthResponse.text(), "bar")
})
