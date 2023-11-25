import * as STD from "./std"
import { SetupParams } from "./types/setup-params"

export const createWithEdgeSpec = (globalSpec) => {
  return (routeSpec) => (routeFn) => async (req, _res) => {}
}

export declare function createWithEdgeSpec(
  globalSpec: SetupParams,
): (routeSpec: any) => (routeFn: any) => (req: STD.Request) => any
