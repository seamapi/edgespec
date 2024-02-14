import test from "ava"
import { Middleware } from "src/middleware"
import { getTestServer } from "tests/fixtures/get-test-server"

test("wintercg middleware injection", async (t) => {
  const sampleMiddleware: Middleware<{}, { middlewareType: string }> = (
    req,
    ctx,
    next
  ) => {
    req.middlewareType = "wintercg"
    return next(req, ctx)
  }

  const fixture = await getTestServer(t, import.meta.url, {
    middleware: [sampleMiddleware],
  })

  const response = await fixture.axios.get("/get-middleware-type")
  t.is(response.data, "wintercg")
})
