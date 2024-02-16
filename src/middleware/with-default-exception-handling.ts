import { Middleware } from "src/middleware/types.ts"

export const withDefaultExceptionHandling: Middleware = async (
  req,
  ctx,
  next
) => {
  try {
    return await next(req, ctx)
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
