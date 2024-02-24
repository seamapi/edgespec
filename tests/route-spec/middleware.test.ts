import test from "ava"
import { Middleware } from "src/middleware/index.ts"
import { getTestRoute } from "tests/fixtures/get-test-route.ts"

const withSessionToken: Middleware<
  {},
  { auth: { session_token: { user: "lucille" } } }
> = (req, ctx, next) => {
  ctx.auth = { ...ctx.auth, session_token: { user: "lucille" } }
  return next(req, ctx)
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

const withName: Middleware<{}, { name: string }> = (req, ctx, next) => {
  ctx.name = "lucille"
  return next(req, ctx)
}

test("receives auth middleware", async (t) => {
  const { axios } = await getTestRoute(t, {
    globalSpec: {
      authMiddleware: {
        pat: withPat,
        api_token: withApiToken,
        session_token: withSessionToken,
      },
    },
    routeSpec: {
      auth: ["pat", "api_token", "session_token"],
      methods: ["GET"],
    },
    routeFn: (req, ctx) => {
      if (!("session_token" in ctx.auth)) {
        t.fail("expected session token in req.auth")
        throw new Error()
      }

      t.log(ctx.auth)
      t.is(ctx.auth.session_token.user, "lucille")

      return new Response(ctx.auth.session_token.user)
    },
    routePath: "/hello",
  })

  const { data } = await axios.get("/hello")
  t.is(data, "lucille")
})

test("fails if all auth middleware fail", async (t) => {
  const { axios } = await getTestRoute(t, {
    globalSpec: {
      authMiddleware: {
        pat: withPat,
        api_token: withApiToken,
      },
      beforeAuthMiddleware: [
        async (req, ctx, next) => {
          try {
            return await next(req, ctx)
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
      beforeAuthMiddleware: [
        (req, ctx, next) => {
          t.is(counter++, 0)
          return next(req, ctx)
        },
      ],

      authMiddleware: {
        pat: (req, ctx, next) => {
          t.is(counter++, 1)
          return next(req, ctx)
        },
      },

      afterAuthMiddleware: [
        (req, ctx, next) => {
          t.is(counter++, 2)
          return next(req, ctx)
        },
      ],
    },
    routeSpec: {
      auth: ["pat"],
      methods: ["GET"],
      middleware: [
        (req, ctx, next) => {
          t.is(counter++, 3)
          return next(req, ctx)
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
      authMiddleware: {},
      beforeAuthMiddleware: [withName],
    },
    routeSpec: {
      auth: "none",
      methods: ["GET"],
    },
    routeFn: (req, ctx) => {
      t.is(ctx.name, "lucille")
      return new Response()
    },
    routePath: "/hello",
  })

  await axios.get("/hello")
})

test("receives local middleware", async (t) => {
  const { axios } = await getTestRoute(t, {
    globalSpec: {
      authMiddleware: {},
    },
    routeSpec: {
      auth: "none",
      methods: ["GET"],
      middleware: [withName],
    },
    routeFn: (req, ctx) => {
      t.is(ctx.name, "lucille")
      return new Response()
    },
    routePath: "/hello",
  })

  await axios.get("/hello")
})

test("responseDefaults are passed", async (t) => {
  const { axios } = await getTestRoute(t, {
    globalSpec: {
      authMiddleware: {},
      beforeAuthMiddleware: [
        (req, ctx, next) => {
          req.responseDefaults.headers.set("x-test", "test")
          req.responseDefaults.headers.set("x-test2", "test2")

          return next(req, ctx)
        },
      ],
    },
    routeSpec: {
      auth: "none",
      methods: ["GET"],
      middleware: [
        (req, ctx, next) => {
          req.responseDefaults.headers.set("x-test", "test2")

          return next(req, ctx)
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

test("allows omitting auth field in route spec", async (t) => {
  const { axios } = await getTestRoute(t, {
    globalSpec: {
      authMiddleware: {
        pat: withPat,
        api_token: withApiToken,
        session_token: withSessionToken,
      },
    },
    routeSpec: {
      methods: ["GET"],
    },
    routeFn: () => {
      return new Response("lucille")
    },
    routePath: "/hello",
  })

  const { data } = await axios.get("/hello")
  t.is(data, "lucille")
})
