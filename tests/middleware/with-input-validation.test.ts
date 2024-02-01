import test from "ava"
import { GlobalSpec } from "src/types/global-spec"
import { EdgeSpecResponse } from "src/types/web-handler"
import { getTestRoute } from "tests/fixtures/get-test-route"
import { z } from "zod"
import formurlencoded from "form-urlencoded"

const defaultSpecs = {
  globalSpec: {
    apiName: "hello-world",
    productionServerUrl: "https://example.com",

    authMiddlewareMap: {},
    globalMiddlewares: [
      async (next, req) => {
        try {
          return await next(req)
        } catch (e: any) {
          return Response.json(
            { error_type: e.constructor.name },
            { status: 500 }
          )
        }
      },
    ],
  } satisfies GlobalSpec,
} as const

test("validates json response success", async (t) => {
  const { axios } = await getTestRoute(t, {
    ...defaultSpecs,
    routeSpec: {
      auth: "none",
      methods: ["POST"],
      jsonBody: z.object({
        name: z.string(),
      }),
      jsonResponse: z.object({
        message: z.string(),
      }),
    },
    routeFn: (req) => {
      return EdgeSpecResponse.json({ message: `hello, ${req.jsonBody.name}!` })
    },
    routePath: "/hello",
  })

  const { data, status } = await axios.post("/hello", { name: "alexandra" })

  t.is(status, 200)
  t.is(data.message, "hello, alexandra!")
})

test("validates json response failure", async (t) => {
  const { axios } = await getTestRoute(t, {
    ...defaultSpecs,
    routeSpec: {
      auth: "none",
      methods: ["POST"],
      jsonBody: z.object({
        name: z.string(),
      }),
      jsonResponse: z.object({
        message: z.string().max(3),
      }),
    },
    routeFn: (req) => {
      return EdgeSpecResponse.json({ message: `hello, ${req.jsonBody.name}!` })
    },
    routePath: "/hello",
  })

  const { data, status } = await axios.post(
    "/hello",
    { name: "alexandra" },
    { validateStatus: () => true }
  )

  t.is(status, 500)
  t.is(data.error_type, "ResponseValidationError")
})

test("validates form data response success", async (t) => {
  const { axios } = await getTestRoute(t, {
    ...defaultSpecs,
    routeSpec: {
      auth: "none",
      methods: ["POST"],
      formData: z.object({
        name: z.string(),
      }),
      jsonResponse: z.object({
        message: z.string(),
      }),
    },
    routeFn: (req) => {
      return EdgeSpecResponse.json({
        message: `hello, ${req.formDataBody.name}!`,
      })
    },
    routePath: "/hello",
  })

  const formData = new FormData()

  formData.set("name", "alexandra")

  const { data, status } = await axios.post("/hello", formData, {
    validateStatus: () => true,
  })

  t.is(status, 200)
  t.is(data.message, "hello, alexandra!")
})

test("validates form data response failure", async (t) => {
  const { axios } = await getTestRoute(t, {
    ...defaultSpecs,
    routeSpec: {
      auth: "none",
      methods: ["POST"],
      formData: z.object({
        name: z.number(),
      }),
      jsonResponse: z.object({
        message: z.string(),
      }),
    },
    routeFn: (req) => {
      return EdgeSpecResponse.json({
        message: `hello, ${req.formDataBody.name}!`,
      })
    },
    routePath: "/hello",
  })

  const formData = new FormData()

  formData.set("name", "alexandra")

  const { data, status } = await axios.post("/hello", formData, {
    validateStatus: () => true,
  })

  t.is(status, 500)
  t.is(data.error_type, "InputValidationError")
})

test("validates url encoded response success", async (t) => {
  const { axios } = await getTestRoute(t, {
    ...defaultSpecs,
    routeSpec: {
      auth: "none",
      methods: ["POST"],
      urlEncodedFormData: z.object({
        name: z.string(),
      }),
      jsonResponse: z.object({
        message: z.string(),
      }),
    },
    routeFn: (req) => {
      return EdgeSpecResponse.json({
        message: `hello, ${req.urlEncodedFormData.name}!`,
      })
    },
    routePath: "/hello",
  })

  const formData = new FormData()

  formData.set("name", "alexandra")

  const { data, status } = await axios.post(
    "/hello",
    formurlencoded({ name: "alexandra" }),
    {
      validateStatus: () => true,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  )

  t.is(status, 200)
  t.is(data.message, "hello, alexandra!")
})

test("validates url encoded response failure", async (t) => {
  const { axios } = await getTestRoute(t, {
    ...defaultSpecs,
    routeSpec: {
      auth: "none",
      methods: ["POST"],
      urlEncodedFormData: z.object({
        name: z.number(),
      }),
      jsonResponse: z.object({
        message: z.string(),
      }),
    },
    routeFn: (req) => {
      return EdgeSpecResponse.json({
        message: `hello, ${req.urlEncodedFormData.name}!`,
      })
    },
    routePath: "/hello",
  })

  const formData = new FormData()

  formData.set("name", "alexandra")

  const { data, status } = await axios.post(
    "/hello",
    formurlencoded({ name: "alexandra" }),
    {
      validateStatus: () => true,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  )

  t.is(status, 500)
  t.is(data.error_type, "InputValidationError")
})

test("commonParams supports json and query params", async (t) => {
  const { axios } = await getTestRoute(t, {
    ...defaultSpecs,
    routeSpec: {
      auth: "none",
      methods: ["POST"],
      commonParams: z.object({
        first_name: z.string(),
        last_name: z.string(),
      }),
      jsonResponse: z.object({
        message: z.string(),
      }),
    },
    routeFn: (req) => {
      return EdgeSpecResponse.json({
        message: `hello, ${req.commonParams.first_name} ${req.commonParams.last_name}!`,
      })
    },
    routePath: "/hello",
  })

  const formData = new FormData()

  formData.set("name", "alexandra")

  const { data, status } = await axios.post(
    "/hello",
    {
      first_name: "John",
    },
    {
      params: {
        last_name: "Doe",
      },
      validateStatus: () => true,
    }
  )

  t.log(data)

  t.is(status, 200)
  t.is(data.message, "hello, John Doe!")
})

test("validate query params success", async (t) => {
  const { axios } = await getTestRoute(t, {
    ...defaultSpecs,
    routeSpec: {
      auth: "none",
      methods: ["GET"],
      queryParams: z.object({
        name: z.string(),
      }),
      jsonResponse: z.object({
        message: z.string(),
      }),
    },
    routeFn: (req) => {
      return EdgeSpecResponse.json({
        message: `hello, ${req.query.name}!`,
      })
    },
    routePath: "/hello",
  })

  const formData = new FormData()

  formData.set("name", "alexandra")

  const { data, status } = await axios.get("/hello", {
    params: {
      name: "jane",
    },
    validateStatus: () => true,
  })

  t.is(status, 200)
  t.is(data.message, "hello, jane!")
})

test("validate query params failure", async (t) => {
  const { axios } = await getTestRoute(t, {
    ...defaultSpecs,
    routeSpec: {
      auth: "none",
      methods: ["GET"],
      queryParams: z.object({
        name: z.number(),
      }),
      jsonResponse: z.object({
        message: z.string(),
      }),
    },
    routeFn: (req) => {
      return EdgeSpecResponse.json({
        message: `hello, ${req.query.name}!`,
      })
    },
    routePath: "/hello",
  })

  const formData = new FormData()

  formData.set("name", "alexandra")

  const { data, status } = await axios.get("/hello", {
    params: {
      name: "jane",
    },
    validateStatus: () => true,
  })

  t.is(status, 500)
  t.is(data.error_type, "InputValidationError")
})
