import { Middleware } from "src/middleware/types"

export const withUnhandledExceptionHandling: Middleware = async (
  req,
  ctx,
  next
) => {
  try {
    return await next(req, ctx)
  } catch (e: any) {
    if ("_isHttpException" in e) {
      console.warn(
        "caught unhandled HTTP exception thrown by EdgeSpec provided middlware; consider adding withDefaultExceptionHandling middleware to your global or route spec"
      )
    } else {
      console.warn(
        "caught unknown unhandled exception; consider adding a exception handling middleware to your global or route spec"
      )
    }

    return new Response(null, {
      status: 500,
    })
  }
}
