import test from "ava"
import { Response } from "src/std/Response"
import { getTestRoute } from "../fixtures/get-test-route"
import { z } from "zod"

test("json-body-01", async (t) => {
  const { axios, serverUrl } = await getTestRoute(t, {
    globalSpec: {},
    routeSpec: {
      auth: "none",
      methods: ["GET", "POST"],
      jsonBody: z.object({
        name: z.string(),
      }),
    },
    routePath: "/post-body",
    routeFn: async (req: any) => {
      const jsonBody = await req.json()
      return new Response(
        JSON.stringify({
          ok: true,
          jsonBody,
        }),
      )
    },
  })

  const { data: res } = await axios.post("/post-body", {
    name: "hello",
  })

  t.is(res.ok, true)
  t.is(res.jsonBody.name, "hello")
})
