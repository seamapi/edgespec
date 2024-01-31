import test from "ava"
import { createWithEdgeSpec } from "src/create-with-edge-spec"
import { EdgeSpecRequest, EdgeSpecResponse } from "src/types/web-handler"
import { z } from "zod"

test("serializes json basic", async (t) => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [],
  })

  const response = await withEdgeSpec({
    auth: "none",
    methods: ["GET"],
    jsonResponse: z.object({
      hello: z.string(),
    }),
  })(() => {
    return EdgeSpecResponse.json({
      hello: "world",
    })
  })({} as EdgeSpecRequest)

  t.is(response.status, 200)
  t.is(response.headers.get("content-type"), "application/json")
  t.is(await streamToString(response.body), JSON.stringify({ hello: "world" }))
})

test("serializes json with status", async (t) => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [],
  })

  const response = await withEdgeSpec({
    auth: "none",
    methods: ["GET"],
    jsonResponse: z.object({
      hello: z.string(),
    }),
  })(() => {
    return EdgeSpecResponse.json({
      hello: "world",
    }).status(201)
  })({} as EdgeSpecRequest)

  t.is(response.status, 201)
  t.is(response.headers.get("content-type"), "application/json")
  t.is(await streamToString(response.body), JSON.stringify({ hello: "world" }))
})

test("validates json response", async (t) => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [],
  })

  await t.throwsAsync(
    async () =>
      withEdgeSpec({
        auth: "none",
        methods: ["GET"],
        jsonResponse: z.object({
          hello: z.string().max(3),
        }),
      })(() => {
        return EdgeSpecResponse.json({
          hello: "world",
        }).status(201)
      })({} as EdgeSpecRequest),
    {
      instanceOf: z.ZodError,
    }
  )
})

test("doesnt validates json response if response validation disabled", async (t) => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [],

    shouldValidateResponses: false,
  })

  const response = await withEdgeSpec({
    auth: "none",
    methods: ["GET"],
    jsonResponse: z.object({
      hello: z.string().max(3),
    }),
  })(() => {
    return EdgeSpecResponse.json({
      hello: "world",
    })
  })({} as EdgeSpecRequest)

  t.is(response.status, 200)
  t.is(response.headers.get("content-type"), "application/json")
  t.is(await streamToString(response.body), JSON.stringify({ hello: "world" }))
})

test("serializes form data", async (t) => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [],
  })

  const response = await withEdgeSpec({
    auth: "none",
    methods: ["GET"],
    formDataResponse: z.object({
      hello: z.string(),
    }),
  })(() => {
    return EdgeSpecResponse.multipartFormData({
      hello: "world",
    })
  })({} as EdgeSpecRequest)

  t.is(response.status, 200)
  t.is(response.headers.get("content-type"), "multipart/form-data")

  const formData = (await streamToString(response.body)) ?? ""

  t.regex(formData, /name="hello"/)
  t.regex(formData, /world/)
})

test("serializes www url-encoded form data", async (t) => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [],
  })

  const response = await withEdgeSpec({
    auth: "none",
    methods: ["GET"],
    wwwFormUrlEncodedResponse: z.object({
      hello: z.string(),
    }),
  })(() => {
    return EdgeSpecResponse.urlEncodedFormData({
      hello: "world",
    })
  })({} as EdgeSpecRequest)

  t.is(response.status, 200)
  t.is(
    response.headers.get("content-type"),
    "application/x-www-form-urlencoded"
  )

  t.is(await streamToString(response.body), "hello=world")
})

test("can set headers, status", async (t) => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [],
  })

  const response = await withEdgeSpec({
    auth: "none",
    methods: ["GET"],
    jsonResponse: z.object({
      hello: z.string(),
    }),
  })(() => {
    return EdgeSpecResponse.json({
      hello: "world",
    })
      .status(201)
      .header("x-hello", "world")
      .headers({
        "x-hello-2": "world2",
        "x-hello": "world2",
      })
  })({} as EdgeSpecRequest)

  t.is(response.status, 201)
  t.is(response.headers.get("content-type"), "application/json")
  t.is(response.headers.get("x-hello"), "world2")
  t.is(response.headers.get("x-hello-2"), "world2")
  t.is(await streamToString(response.body), JSON.stringify({ hello: "world" }))
})

test("can return custom response types", async (t) => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [],
  })

  const response = await withEdgeSpec({
    auth: "none",
    methods: ["GET"],
    customResponseMap: {
      "text/html": z.string(),
    },
  })(() => {
    return EdgeSpecResponse.custom("<h1>Hello, world</h1>", "text/html")
  })({} as EdgeSpecRequest)

  t.is(response.status, 200)
  t.is(response.headers.get("content-type"), "text/html")
  t.is(await streamToString(response.body), "<h1>Hello, world</h1>")
})

test("can have multiple custom response types", async (t) => {
  const withEdgeSpec = createWithEdgeSpec({
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [],
  })

  const response = await withEdgeSpec({
    auth: "none",
    methods: ["GET"],
    customResponseMap: {
      "text/html": z.string(),
      "custom/response": z.number(),
    },
  })(() => {
    return EdgeSpecResponse.custom(4, "custom/response")
  })({} as EdgeSpecRequest)

  t.is(response.status, 200)
  t.is(response.headers.get("content-type"), "custom/response")
  t.is(await streamToString(response.body), "4")
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
