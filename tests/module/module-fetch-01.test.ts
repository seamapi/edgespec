import test from "ava"
import { ModuleService } from "src/lib/ModuleService.js"

test("module-fetch-01", async (t) => {
  const moduleService = new ModuleService({
    "/health.ts": async (req: any) => {
      return new Response(
        JSON.stringify({
          ok: true,
        })
      )
    },
  })

  const res = await moduleService.fetch("/health").then((r) => r.json())

  t.deepEqual(res, { ok: true })
})
