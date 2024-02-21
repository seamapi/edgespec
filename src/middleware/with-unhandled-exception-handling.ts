import { Middleware } from "src/middleware/types.ts"
import { Logger } from "./with-logger.ts"

export const withUnhandledExceptionHandling: Middleware<{
  logger?: Logger
}> = async (req, ctx, next) => {
  try {
    return await next(req, ctx)
  } catch (e: any) {
    const logger = req.logger ?? console

    if ("_isHttpException" in e) {
      logger.warn(
        "Caught unhandled HTTP exception thrown by EdgeSpec provided middleware. Consider adding withDefaultExceptionHandling middleware to your global or route spec."
      )
    } else {
      logger.warn(
        "Caught unknown unhandled exception; consider adding a exception handling middleware to your global or route spec."
      )
    }

    logger.error(e)

    return new Response(null, {
      status: 500,
    })
  }
}
