import test from "ava"
import { getTestRoute } from "../fixtures/get-test-route.js"

test("unhandled exception doesn't explode", async (t) => {
  const { axios } = await getTestRoute(t, {
    globalSpec: {
      apiName: "hello-world",
      productionServerUrl: "https://example.com",

      authMiddlewares: {},
      beforeAuthMiddlewares: [],
    },
    routeSpec: {
      auth: "none",
      methods: ["GET"],
    },
    routeFn: () => {
      throw new Error("unhandled")
    },
    routePath: "/hello",
  })
  const response = await axios.get("/hello", { validateStatus: () => true })

  t.is(response.status, 500)
  t.falsy(response.data)
})
