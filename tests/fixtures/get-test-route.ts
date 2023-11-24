import * as STD from "src/std"
import { createWithEdgeSpec } from "src/create-with-edge-spec"
import type { AxiosInstance } from "axios"

export const getTestRoute = (
  t: any,
  opts: {
    globalSpec: any
    routeSpec: any
    routePath: string,
    routeFn: (req: STD.Request) => any
  },
): Promise<{ axios: AxiosInstance }> => {
  const withRouteSpec = createWithEdgeSpec(globalSpec)

}
