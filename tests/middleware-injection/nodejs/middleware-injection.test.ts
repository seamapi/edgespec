import test from "ava"
import { Middleware } from "../../../src/middleware/index.js"
import { getTestServer } from "../../../tests/fixtures/get-test-server.js"

test("Node.js middleware injection", async (t) => {
  const sampleMiddleware: Middleware<{}, { middlewareType: string }> = (
    req,
    ctx,
    next
  ) => {
    ctx.middlewareType = "nodejs"
    return next(req, ctx)
  }

  const fixture = await getTestServer(t, import.meta.url, {
    middleware: [sampleMiddleware],
  })

  const response = await fixture.axios.get("/get-middleware-type")
  t.is(response.data, "nodejs")
})
