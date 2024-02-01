import { Middleware } from "src/middleware/types"

export const withDefaultExceptionHandling: Middleware = async (next, req) => {
  try {
    return await next(req)
  } catch (e: any) {
    if ("_isHttpException" in e) {
      return Response.json(
        {
          message: e.message,
        },
        {
          status: e.status,
        }
      )
    }

    throw e
  }
}
