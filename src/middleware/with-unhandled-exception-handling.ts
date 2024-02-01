import { Middleware } from "src/types/middleware"

export const withUnhandledExceptionHandling: Middleware = async (next, req) => {
  try {
    return await next(req)
  } catch (e: any) {
    if ("_isHttpException" in e) {
      console.warn(
        "caught unhandled http exception; consider adding withDefaultExceptionHandling middleware to your global or route spec"
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
