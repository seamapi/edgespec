import test from "ava"
import { createWithEdgeSpec } from "src/create-with-edge-spec"
import { expectTypeOf } from "expect-type"
import { EdgeSpecRequest, EdgeSpecResponse } from "src/types/web-handler"
import { z } from "zod"

const withSessionToken = () => ({
  auth: { session_token: { user: "lucille" } },
})
const withPat = () => ({ auth: { pat: { user: "lucille" } } })
const withApiToken = () => ({ auth: { api_token: { user: "lucille" } } })
const withName = () => ({ name: "lucille" })

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
      session_token: () => ({}),
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
  })({} as EdgeSpecRequest)
})
