import {z} from "zod"

type PlaceholderRouteSpec = {
  methods: ("GET" | "POST" | "PUT" | "PATCH" | "DELETE")[]
  jsonBody?: z.ZodTypeAny
  jsonResponse?: z.ZodTypeAny
}

// todo: replace with real route spec
export const placeholderWithRouteSpec = <T extends PlaceholderRouteSpec>(spec: T) => (next: (req: Request) => Response) => {
  return next
}
