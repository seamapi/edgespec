import test from "ava"
import { Middleware } from "src"
import { createWithEdgeSpec } from "src/create-with-edge-spec"
import { EdgeSpecRequest } from "src/types/web-handler"

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
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {
      pat: withPat,
      api_token: withApiToken,
      session_token: withSessionToken,
    },
    globalMiddlewares: [],
  })

  await withEdgeSpec({
    auth: ["pat", "api_token", "session_token"],
    methods: ["GET"],
  })((req) => {
    if (!("session_token" in req.auth)) {
      t.fail("expected session token in req.auth")
      throw new Error()
    }

    t.log(req.auth)
    t.is(req.auth.session_token.user, "lucille")

    return new Response()
  })({} as EdgeSpecRequest)
})

test("fails if all auth middleware fail", async (t) => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {
      pat: withPat,
      api_token: withApiToken,
    },
    globalMiddlewares: [],

    onMultipleAuthMiddlewareFailures: (errs: any[]) => {
      for (const err of errs) {
        t.is(err.message, "Unauthorized")
      }

      throw new Error("Unauthorized Wrapper")
    },
  })

  await t.throwsAsync(
    async () =>
      withEdgeSpec({
        auth: ["api_token", "pat"],
        methods: ["GET"],
      })(() => {
        t.fail("endpoint should not be called")
        return new Response()
      })({} as EdgeSpecRequest),
    {
      message: "Unauthorized Wrapper",
    }
  )
})

test("middlewares run in correct order", async (t) => {
  let counter = 0

  const withEdgeSpec = createWithEdgeSpec({
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
  })

  await withEdgeSpec({
    auth: ["pat"],
    methods: ["GET"],
    middlewares: [
      (next, req) => {
        t.is(counter++, 3)
        return next(req)
      },
    ],
  })(() => {
    return new Response()
  })({} as EdgeSpecRequest)

  t.is(counter, 4)
})

test("receives route middleware", async (t) => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [withName],
  })

  await withEdgeSpec({
    auth: "none",
    methods: ["GET"],
  })((req) => {
    t.is(req.name, "lucille")
    return new Response()
  })({} as EdgeSpecRequest)
})

test("receives local middleware", async (t) => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [],
  })

  await withEdgeSpec({
    auth: "none",
    methods: ["GET"],
    middlewares: [withName],
  })((req) => {
    t.is(req.name, "lucille")
    return new Response()
  })({} as EdgeSpecRequest)
})

test("responseDefaults are passed", async (t) => {
  const withEdgeSpec = createWithEdgeSpec({
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
  })

  const response = await withEdgeSpec({
    auth: "none",
    methods: ["GET"],
    middlewares: [
      (next, req) => {
        req.responseDefaults.headers.set("x-test", "test2")

        return next(req)
      },
    ],
  })(() => {
    return new Response()
  })({} as EdgeSpecRequest)

  t.is(await response.text(), "body text")
  t.is(response.headers.get("x-test"), "test2")
  t.is(response.headers.get("x-test2"), "test2")
})

test("responseDefaults are passed (responseDefaults as ResponseInit)", async (t) => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [
      (next, req) => {
        req.responseDefaults.headers.set("x-test", "test")

        return next(req)
      },
    ],
  })

  const response = await withEdgeSpec({
    auth: "none",
    methods: ["GET"],
    middlewares: [
      (next, req) => {
        req.responseDefaults.headers.set("x-test", "test2")

        return next(req)
      },
    ],
  })(() => {
    return new Response("body text")
  })({} as EdgeSpecRequest)

  t.is(await response.text(), "body text")
  t.is(response.headers.get("x-test"), "test2")
  t.is(response.headers.get("x-test2"), "test2")
})

test("responseDefaults are passed (responseDefaults as EdgeSpecResponse)", async (t) => {
  const withEdgeSpec = createWithEdgeSpec({
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
  })

  const response = await withEdgeSpec({
    auth: "none",
    methods: ["GET"],
    middlewares: [
      (next, req) => {
        req.responseDefaults.headers.set("x-test", "test2")

        return next(req)
      },
    ],
  })(() => {
    return new Response("body text")
  })({} as EdgeSpecRequest)

  t.is(await response.text(), "body text")
  t.is(response.headers.get("x-test"), "test2")
  t.is(response.headers.get("x-test2"), "test2")
})
