import test from "ava"

test("get json from response", async (t) => {
  const res = new Response(JSON.stringify({ ok: true }))

  const json = await res.json()

  t.is(json.ok, true)
})
