import test from "ava"
import { getTestRoute } from "../fixtures/get-test-route.js"
import { withDefaultExceptionHandling } from "src/middleware/with-default-exception-handling.js"
import { HttpException } from "src/middleware/http-exceptions.js"

test("handles internal middleware issues", async (t) => {
  const { axios } = await getTestRoute(t, {
    globalSpec: {
      authMiddleware: {},
      beforeAuthMiddleware: [withDefaultExceptionHandling],
    },
    routeSpec: {
      auth: "none",
      methods: ["GET"],
    },
    routeFn: () => {
      return Response.json({ message: "hello world!" })
    },
    routePath: "/hello",
  })

  const response = await axios.post(
    "/hello",
    {},
    { validateStatus: () => true }
  )

  t.is(response.status, 405)
  t.is(response.data.message, "only GET accepted")
})

test("handles custom http exceptions", async (t) => {
  const { axios } = await getTestRoute(t, {
    globalSpec: {
      authMiddleware: {},
      beforeAuthMiddleware: [withDefaultExceptionHandling],
    },
    routeSpec: {
      auth: "none",
      methods: ["GET"],
    },
    routeFn: () => {
      const e: HttpException = {
        _isHttpException: true,
        status: 400,
        message: "custom error",
      }

      throw e
    },
    routePath: "/hello",
  })

  const response = await axios.get("/hello", { validateStatus: () => true })

  t.is(response.status, 400)
  t.is(response.data.message, "custom error")
})
