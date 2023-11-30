import test from "ava"
import { Response } from "src/std/Response.js"
import { getTestRoute } from "../fixtures/get-test-route.js"

test("basic-01", async (t) => {
  const { axios, serverUrl } = await getTestRoute(t, {
    globalSpec: {},
    routeSpec: {
      auth: "none",
      methods: ["GET", "POST"],
    },
    routePath: "/health",
    routeFn: async (req: any) => {
      return new Response(
        JSON.stringify({
          ok: true,
        }),
      )
    },
  })

  const { data: res } = await axios.get("/health")

  t.is(res.ok, true)
})
