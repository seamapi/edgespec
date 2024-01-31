import test from "ava"
import { createWithEdgeSpec } from "src/create-with-edge-spec"
import { EdgeSpecRequest } from "src/types/web-handler"

const withSessionToken = () => ({
  auth: { session_token: { user: "lucille" } },
})
const withPat = () => {
  throw new Error("Unauthorized")
  return { auth: { pat: { user: "lucille" } } }
}
const withApiToken = () => {
  throw new Error("Unauthorized")
  return { auth: { api_token: { user: "lucille" } } }
}

const withName = () => ({ name: "lucille" })

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
      () => {
        t.is(counter++, 0)
        return {}
      },
    ],

    authMiddlewareMap: {
      pat: () => {
        t.is(counter++, 1)
        return {}
      },
    },

    globalMiddlewaresAfterAuth: [
      () => {
        t.is(counter++, 2)
        return {}
      },
    ],
  })

  await withEdgeSpec({
    auth: ["pat"],
    methods: ["GET"],
    middlewares: [
      () => {
        t.is(counter++, 3)
        return {}
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
      () => ({
        responseDefaults: new Response(null, {
          headers: new Headers({ "x-test": "test", "x-test2": "test2" }),
        }),
      }),
    ],
  })

  const response = await withEdgeSpec({
    auth: "none",
    methods: ["GET"],
    middlewares: [
      () => ({
        responseDefaults: new Response("body text", {
          headers: new Headers({ "x-test": "test2" }),
        }),
      }),
    ],
  })(() => {
    return new Response()
  })({} as EdgeSpecRequest)

  t.is(await streamToString(response.body), "body text")
  t.is(response.headers.get("x-test"), "test2")
  t.is(response.headers.get("x-test2"), "test2")
})

test("responseDefaults are passed (responseDefaults as ResponseInit)", async (t) => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [
      () => ({
        responseDefaults: {
          headers: { "x-test": "test", "x-test2": "test2" },
        },
      }),
    ],
  })

  const response = await withEdgeSpec({
    auth: "none",
    methods: ["GET"],
    middlewares: [
      () => ({
        responseDefaults: {
          headers: { "x-test": "test2" },
        },
      }),
    ],
  })(() => {
    return new Response("body text")
  })({} as EdgeSpecRequest)

  t.is(await streamToString(response.body), "body text")
  t.is(response.headers.get("x-test"), "test2")
  t.is(response.headers.get("x-test2"), "test2")
})

async function streamToString(
  stream: ReadableStream<Uint8Array> | undefined | null
) {
  if (!stream) return undefined

  const reader = stream.getReader()
  const textDecoder = new TextDecoder()
  let result = ""

  async function read() {
    const { done, value } = await reader.read()

    if (done) {
      return result
    }

    result += textDecoder.decode(value, { stream: true })
    return read()
  }

  return read()
}
