import test from "ava"
import { Middleware } from "src"
import { createWithEdgeSpec } from "src/create-with-edge-spec"
import { EdgeSpecRequest } from "src/types/web-handler"
import { getTestRoute } from "tests/fixtures/get-test-route"

const withSessionToken: Middleware<
  {},
  { auth: { session_token: { user: "lucille" } } }
> = (next, req) => {
  req.auth = { ...req.auth, session_token: { user: "lucille" } }
  return next(req)
}

const withPat: Middleware<{}, { auth: { pat: { user: "lucille" } } }> = () => {
  throw new Error("Unauthorized")
}

const withApiToken: Middleware<
  {},
  { auth: { api_token: { user: "lucille" } } }
> = () => {
  throw new Error("Unauthorized")
}

const withName: Middleware<{}, { name: string }> = (next, req) => {
  req.name = "lucille"
  return next(req)
}

test("receives auth middleware", async (t) => {
  const { axios } = await getTestRoute(t, {
    globalSpec: {
      apiName: "hello-world",
      productionServerUrl: "https://example.com",

      authMiddlewareMap: {
        pat: withPat,
        api_token: withApiToken,
        session_token: withSessionToken,
      },
      globalMiddlewares: [],
    },
    routeSpec: {
      auth: ["pat", "api_token", "session_token"],
      methods: ["GET"],
    },
    routeFn: (req) => {
      if (!("session_token" in req.auth)) {
        t.fail("expected session token in req.auth")
        throw new Error()
      }

      t.log(req.auth)
      t.is(req.auth.session_token.user, "lucille")

      return new Response(req.auth.session_token.user)
    },
    routePath: "/hello",
  })

  const { data } = await axios.get("/hello")
  t.is(data, "lucille")
})

test("fails if all auth middleware fail", async (t) => {
  const { axios } = await getTestRoute(t, {
    globalSpec: {
      apiName: "hello-world",
      productionServerUrl: "https://example.com",

      authMiddlewareMap: {
        pat: withPat,
        api_token: withApiToken,
      },
      globalMiddlewares: [
        async (next, req) => {
          try {
            return await next(req)
          } catch (err: any) {
            return new Response(err.message, { status: 500 })
          }
        },
      ],

      onMultipleAuthMiddlewareFailures: (errs: any[]) => {
        for (const err of errs) {
          t.is(err.message, "Unauthorized")
        }

        throw new Error("Unauthorized Wrapper")
      },
    },
    routeSpec: {
      auth: ["api_token", "pat"],
      methods: ["GET"],
    },
    routeFn: () => {
      t.fail("endpoint should not be called")
      return new Response()
    },
    routePath: "/hello",
  })

  const { status, data } = await axios.get("/hello", {
    validateStatus: () => true,
  })
  t.is(status, 500)
  t.is(data, "Unauthorized Wrapper")
})

test("middlewares run in correct order", async (t) => {
  let counter = 0

  const { axios } = await getTestRoute(t, {
    globalSpec: {
      apiName: "hello-world",
      productionServerUrl: "https://example.com",

      globalMiddlewares: [
        (next, req) => {
          t.is(counter++, 0)
          return next(req)
        },
      ],

      authMiddlewareMap: {
        pat: (next, req) => {
          t.is(counter++, 1)
          return next(req)
        },
      },

      globalMiddlewaresAfterAuth: [
        (next, req) => {
          t.is(counter++, 2)
          return next(req)
        },
      ],
    },
    routeSpec: {
      auth: ["pat"],
      methods: ["GET"],
      middlewares: [
        (next, req) => {
          t.is(counter++, 3)
          return next(req)
        },
      ],
    },
    routeFn: () => {
      return new Response()
    },
    routePath: "/hello",
  })

  await axios.get("/hello")
  t.is(counter, 4)
})

test("receives route middleware", async (t) => {
  const { axios } = await getTestRoute(t, {
    globalSpec: {
      apiName: "hello-world",
      productionServerUrl: "https://example.com",

      authMiddlewareMap: {},
      globalMiddlewares: [withName],
    },
    routeSpec: {
      auth: "none",
      methods: ["GET"],
    },
    routeFn: (req) => {
      t.is(req.name, "lucille")
      return new Response()
    },
    routePath: "/hello",
  })

  await axios.get("/hello")
})

test("receives local middleware", async (t) => {
  const { axios } = await getTestRoute(t, {
    globalSpec: {
      apiName: "hello-world",
      productionServerUrl: "https://example.com",

      authMiddlewareMap: {},
      globalMiddlewares: [],
    },
    routeSpec: {
      auth: "none",
      methods: ["GET"],
      middlewares: [withName],
    },
    routeFn: (req) => {
      t.is(req.name, "lucille")
      return new Response()
    },
    routePath: "/hello",
  })

  await axios.get("/hello")
})

test("responseDefaults are passed", async (t) => {
  const { axios } = await getTestRoute(t, {
    globalSpec: {
      apiName: "hello-world",
      productionServerUrl: "https://example.com",

      authMiddlewareMap: {},
      globalMiddlewares: [
        (next, req) => {
          req.responseDefaults.headers.set("x-test", "test")
          req.responseDefaults.headers.set("x-test2", "test2")

          return next(req)
        },
      ],
    },
    routeSpec: {
      auth: "none",
      methods: ["GET"],
      middlewares: [
        (next, req) => {
          req.responseDefaults.headers.set("x-test", "test2")

          return next(req)
        },
      ],
    },
    routeFn: () => {
      return new Response("body text")
    },
    routePath: "/hello",
  })

  const { data, headers } = await axios.get("/hello")
  t.is(data, "body text")

  // @ts-expect-error
  t.is(headers.get("x-test"), "test2")
  // @ts-expect-error
  t.is(headers.get("x-test2"), "test2")
})
