import test from "ava"
import { Middleware } from "src/middleware/types.ts"
import { EdgeSpecResponse } from "src/types/web-handler.ts"
import { getTestRoute } from "tests/fixtures/get-test-route.ts"
import { z } from "zod"

test("auth middleware has access to route parameters (withInputValidation() runs before user middleware)", async (t) => {
  const authTokenMiddleware: Middleware<{
    urlEncodedFormData: { authToken: string }
  }> = async (req, ctx, next) => {
    if (req.urlEncodedFormData.authToken !== "foo") {
      return EdgeSpecResponse.json(
        { message: "invalid token" },
        { status: 401 }
      )
    }

    return next(req, ctx)
  }

  const { axios } = await getTestRoute(t, {
    globalSpec: {
      authMiddleware: {
        token: authTokenMiddleware,
      },
    },
    routeSpec: {
      auth: "token",
      methods: ["POST"],
      urlEncodedFormData: z.object({
        authToken: z.string(),
        name: z.string(),
      }),
      jsonResponse: z.object({
        message: z.string(),
      }),
    },
    routeFn: (req) => {
      return EdgeSpecResponse.json({
        message: `hello, ${req.urlEncodedFormData.name}!`,
      })
    },
    routePath: "/hello",
  })

  {
    const { data, status } = await axios.post(
      "/hello",
      new URLSearchParams({ name: "alexandra", authToken: "foo" })
    )

    t.is(status, 200)
    t.is(data.message, "hello, alexandra!")
  }

  // Throws for invalid token
  {
    const { data, status } = await axios.post(
      "/hello",
      new URLSearchParams({ name: "alexandra", authToken: "bar" }),
      { validateStatus: () => true }
    )

    t.is(status, 401)
  }
})
