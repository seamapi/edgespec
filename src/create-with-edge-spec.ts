import { SetupParams } from "./types/setup-params.js"
import { EdgeSpecRouteFn } from "./types/web-handler.js"

export const createWithEdgeSpec = (globalSpec: SetupParams) => {
  return (routeSpec: any) =>
    (routeFn: EdgeSpecRouteFn): EdgeSpecRouteFn =>
    async (req: Request) => {
      // Identify environment this is being executed in and convert to WinterCG-
      // compatible request

      // Execute middleware + auth middleware etc.
      for (const auth_method of routeSpec.auth ?? []) {
        // ...
      }

      try {
        return await routeFn(req)
      } catch (e) {
        // TODO: Use exception handling middleware to handle failure
        throw e
      }
    }
}
