import test from "ava"
import { Middleware } from "src/middleware"
import { getTestServer } from "tests/fixtures/get-test-server"

test("Node.js middleware injection", async (t) => {
  const sampleMiddleware: Middleware<{}, { middlewareType: string }> = (
    next,
    req
  ) => {
    req.middlewareType = "nodejs"
    return next(req)
  }

  const fixture = await getTestServer(t, import.meta.url, {
    middleware: [sampleMiddleware],
  })

  const response = await fixture.axios.get("/get-middleware-type")
  t.is(response.data, "nodejs")
})
