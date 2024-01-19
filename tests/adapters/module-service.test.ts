import test from "ava"
import { getTestRoute } from "../fixtures/get-test-route.js"
import { createModuleService } from "src/adapters/module-service.js"
import { createEdgeSpecFromRouteMap } from "src/serve/create-server-from-route-map.js"

test("module service with simple endpoint", async (t) => {
  const ModuleService = createModuleService(
    createEdgeSpecFromRouteMap({
      "/health": async (req) => {
        return new Response(
          JSON.stringify({
            ok: true,
          })
        )
      },
    })
  )

  const { axios } = await getTestRoute(t, {
    globalSpec: {},
    routeSpec: {
      auth: "none",
      methods: ["GET", "POST"],
    },
    routePath: "/module_service/[...path]",
    routeFn: ModuleService(),
  })

  const { data: res } = await axios.get("/module_service/health")

  t.is(res.ok, true)
})

test("module service with complex delegation pattern", async (t) => {
  const ModuleService1 = createModuleService(
    createEdgeSpecFromRouteMap({
      "/health1": async () => {
        return new Response(
          JSON.stringify({
            from: "module1",
          })
        )
      },
    })
  )

  const ModuleService2 = createModuleService(
    createEdgeSpecFromRouteMap({
      "/health2": async () => {
        return new Response(
          JSON.stringify({
            from: "module2",
          })
        )
      },
    })
  )

  const { axios } = await getTestRoute(t, {
    globalSpec: {},
    routeSpec: {
      auth: "none",
      methods: ["GET", "POST"],
    },
    routePath: "/module_service/[...path]",
    routeFn: async (req) => {
      const { delegateTo } = await req.json()

      if (delegateTo === "module1") {
        return await ModuleService1()(req)
      }

      if (delegateTo === "module2") {
        return await ModuleService2()(req)
      }

      throw new Error("Invalid delegateTo")
    },
  })

  {
    const { data: res } = await axios.post("/module_service/health1", {
      delegateTo: "module1",
    })

    t.is(res.from, "module1")
  }

  {
    const { data: res } = await axios.post("/module_service/health2", {
      delegateTo: "module2",
    })

    t.is(res.from, "module2")
  }
})

test("module service cascades settings", async (t) => {
  const ModuleService = createModuleService(
    createEdgeSpecFromRouteMap({
      "/health": async () => {
        return new Response(
          JSON.stringify({
            ok: true,
          })
        )
      },
    })
  )

  const { axios } = await getTestRoute(t, {
    globalSpec: {},
    routeSpec: {
      auth: "none",
      methods: ["GET", "POST"],
    },
    routePath: "/module_service/[...path]",
    routeFn: ModuleService(),
    edgeSpecOptions: {
      handle404: () => {
        return new Response(
          JSON.stringify({
            ok: false,
          })
        )
      },
    },
  })

  const { data: res } = await axios.get("/module_service/404notfound")

  t.is(res.ok, false)
})

test("module service cascades route param not found settings", async (t) => {
  const ModuleService = createModuleService(createEdgeSpecFromRouteMap({}))

  const { axios } = await getTestRoute(t, {
    globalSpec: {},
    routeSpec: {
      auth: "none",
      methods: ["GET", "POST"],
    },
    routePath: "/module_service/[...path2]",
    routeFn: ModuleService({
      handleRouteParamNotFound: () => {
        return new Response(
          JSON.stringify({
            ok: false,
          })
        )
      },
      allowMatchingOnAnyCatchAllRouteParam: false,
    }),
    edgeSpecOptions: {
      handleModuleServiceRouteNotFound: () => {
        return new Response(
          JSON.stringify({
            ok: true,
          })
        )
      },
    },
  })

  const { data: res, status } = await axios.get("/module_service/anyroute", {
    validateStatus: () => true,
  })

  t.is(status, 200)
  t.is(res.ok, false)
})
