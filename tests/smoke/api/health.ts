import { z } from "zod"

const health = async (request: Request) => {
  return Response.json({
    method: request.method,
    body: await request.json(),
    headers: Object.fromEntries(request.headers.entries()),
  })
}

export const schema = z.object({
  foo: z.string(),
  bar: z.number(),
})

export default health
