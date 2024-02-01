import test from "ava"
import { getTestRoute } from "../fixtures/get-test-route.js"
import { z } from "zod"

test("json-body-01", async (t) => {
  const { axios, serverUrl } = await getTestRoute(t, {
    globalSpec: {
      apiName: "hello-world",
      productionServerUrl: "https://example.com",

      authMiddlewareMap: {},
      globalMiddlewares: [],
    },
    routeSpec: {
      auth: "none",
      methods: ["GET", "POST"],
      jsonBody: z.object({
        name: z.string(),
      }),
      jsonResponse: z.object({
        jsonBody: z.object({
          name: z.string(),
        }),
        ok: z.boolean(),
      }),
    },
    routePath: "/post-body",
    routeFn: async (req) => {
      return new Response(
        JSON.stringify({
          ok: true,
          jsonBody: req.jsonBody,
        })
      )
    },
  })

  const { data: res } = await axios.post(
    "/post-body",
    {
      name: "hello",
    },
    {
      validateStatus: () => true,
    }
  )

  t.is(res.ok, true)
  t.is(res.jsonBody.name, "hello")
})
