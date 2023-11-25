import test from "ava"
import { Response } from "src/std"

test("get json from response", async (t) => {
  const res = new Response(JSON.stringify({ ok: true }))

  console.log(res)

  const json = await res.json()

  t.is(json.ok, true)
})
