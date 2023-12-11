import test from "ava"
import { getTestServer } from "tests/fixtures/get-test-server"

test("request passes through method, body, and headers", async t => {
  const {axios} = await getTestServer(t, import.meta.url)

  const response = await axios.post(`/health`, {
    foo: "bar"
  }, {
    headers: {
      "x-foo": "bar"
    }
  })

  t.like(response.data, {
    method: "POST",
    body: {
      foo: "bar"
    },
    headers: {
      "x-foo": "bar"
    },
  })
})

test("response passes through status and headers", async t => {
  const {axios} = await getTestServer(t, import.meta.url)

  const response = await axios.get('/echo', {
    params: {
      status: 201,
    },
    headers: {
      "x-foo": "bar"
    }
  })
  t.is(response.status, 201)
  t.is(response.headers['x-foo'], 'bar')
})

test("path params are available", async t => {
  const {axios} = await getTestServer(t, import.meta.url)

  const response = await axios.get(`/users/123`)
  t.deepEqual(response.data, {
    userId: "123",
  })
})
