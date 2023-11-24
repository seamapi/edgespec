import * as STD from "./std"

export const createWithEdgeSpec = (globalSpec) => {
  return (routeSpec) => (routeFn) => async (req, _res) => {}
}

export declare function createWithEdgeSpec(
  globalSpec: any
): (routeSpec: any) => (routeFn: any) => (req: STD.Request) => any
