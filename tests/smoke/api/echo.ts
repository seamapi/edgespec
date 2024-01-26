import { z } from "zod"

const echo = async (request: Request) => {
  const url = new URL(request.url)
  return new Response("", {
    status: Number(url.searchParams.get("status") ?? 400),
    headers: request.headers,
  })
}

// export default echo
const input = z.object({ foo: z.string() })
const spec = <T>(input: z.ZodType<T>) => input
export default spec(input)
