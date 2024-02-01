import test from "ava"
import { createWithEdgeSpec } from "src/create-with-edge-spec"
import { expectTypeOf } from "expect-type"
import { EdgeSpecResponse } from "src/types/web-handler"
import { z } from "zod"
import { Middleware } from "src/middleware"

const withSessionToken: Middleware<
  {},
  { auth: { session_token: { user: "lucille" } } }
> = (next, req) => {
  req.auth = { ...req.auth, session_token: { user: "lucille" } }
  return next(req)
}

const withPat: Middleware<{}, { auth: { pat: { user: "lucille" } } }> = (
  next,
  req
) => {
  req.auth = { ...req.auth, pat: { user: "lucille" } }
  return next(req)
}

const withApiToken: Middleware<
  {},
  { auth: { api_token: { user: "lucille" } } }
> = (next, req) => {
  req.auth = { ...req.auth, api_token: { user: "lucille" } }
  return next(req)
}

const withName: Middleware<{}, { name: string }> = (next, req) => {
  req.name = "lucille"
  return next(req)
}

test.skip("auth none is always supported", () => {
  createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [],
  })({
    auth: "none",
    methods: ["GET"],
  })
})

test.skip("auth none cannot be provided in an array", () => {
  createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [],
  })({
    // @ts-expect-error
    auth: ["none"],
    methods: ["GET"],
  })
})

test.skip("cannot select non-existent auth methods", () => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [],
  })

  withEdgeSpec({
    // @ts-expect-error
    auth: "session_token",
    methods: ["GET"],
  })

  withEdgeSpec({
    // @ts-expect-error
    auth: ["session_token"],
    methods: ["GET"],
  })
})

test.skip("can select existing middleware", () => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {
      session_token: (next, req) => next(req),
    },
    globalMiddlewares: [],
  })

  withEdgeSpec({
    auth: "session_token",
    methods: ["GET"],
  })

  withEdgeSpec({
    auth: ["session_token"],
    methods: ["GET"],
  })
})

test.skip("middleware objects are available", () => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [withName],
  })

  withEdgeSpec({
    auth: "none",
    methods: ["GET"],
  })((req) => {
    expectTypeOf<(typeof req)["name"]>().toBeString()

    return new Response()
  })
})

test.skip("auth middleware objects are available as singleton", () => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {
      session_token: withSessionToken,
    },
    globalMiddlewares: [],
  })

  withEdgeSpec({
    auth: "session_token",
    methods: ["GET"],
  })((req) => {
    expectTypeOf<(typeof req)["auth"]>().toMatchTypeOf<{
      session_token: { user: string }
    }>()

    return new Response()
  })
})

test.skip("auth middleware objects are available as union", () => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {
      session_token: withSessionToken,
      pat: withPat,
      api_token: withApiToken,
    },
    globalMiddlewares: [],
  })

  withEdgeSpec({
    auth: ["session_token", "pat"],
    methods: ["GET"],
  })((req) => {
    expectTypeOf<(typeof req)["auth"]>().toMatchTypeOf<
      | {
          session_token: { user: string }
        }
      | {
          pat: { user: string }
        }
    >()

    return new Response()
  })
})

test.skip("route-local middlewares are available to request", () => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [],
  })

  withEdgeSpec({
    auth: "none",
    methods: ["GET"],
    middlewares: [withName],
  })((req) => {
    expectTypeOf<(typeof req)["name"]>().toBeString()

    return new Response()
  })
})

test.skip("custom response map types are enforced", () => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [],
  })

  withEdgeSpec({
    auth: "none",
    methods: ["GET"],
    customResponseMap: {
      "text/html": z.string(),
      "custom/response": z.number(),
    },
    // @ts-expect-error
  })(() => {
    return EdgeSpecResponse.custom("not a number", "custom/response")
  })({} as any)
})

test.skip("route param types", () => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [],
  })

  withEdgeSpec({
    auth: "none",
    methods: ["GET"],
    routeParams: z.object({ id: z.coerce.number() }),
  })((req) => {
    expectTypeOf(req.routeParams.id).toBeNumber()
    return new Response()
  })({} as any)
})
