import { RouteFn } from "./create-with-edge-spec.types.js"
import { SetupParams } from "./types/setup-params.js"
import { Request, Response } from "./std/index.js"

export const createWithEdgeSpec = (globalSpec: SetupParams) => {
  return (routeSpec: any) =>
    (routeFn: RouteFn) =>
    async (req: Request): Promise<Response> => {
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
