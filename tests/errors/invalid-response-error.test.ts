import test from "ava"
import { z } from "zod"
import { getTestRoute } from "tests/fixtures/get-test-route.ts"

test("sending an invalid response logs a verbose error", async (t) => {
  const { axios, getLogs } = await getTestRoute(t, {
    globalSpec: {
      authMiddleware: {},
    },
    routeSpec: {
      methods: ["POST"],
      jsonBody: z.any(),
      jsonResponse: z.object({
        a_valid_response_shape: z.string(),
      }),
    },
    routePath: "/echo",
    routeFn: (req, ctx) => {
      return ctx.json(req.jsonBody)
    },
  })

  const { status } = await axios.post(
    "/echo",
    { foo: "invalid-response-shape" },
    { validateStatus: () => true }
  )
  t.is(status, 500)

  const logs = getLogs()
  const loggedError = logs.error.find((log) => log[0] instanceof Error)?.[0]
  t.truthy(loggedError)
  t.true(loggedError.stack.includes("`a_valid_response_shape` is required"))
})
