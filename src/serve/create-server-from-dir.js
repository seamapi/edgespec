import { loadApiDirectoryAsRouteMap } from "../build/load-api-directory-as-route-map"
import { createServerFromRouteMap } from "./create-server-from-route-map"

export const createServerFromDir = async (dirPath) => {
  const apiVfs = await loadApiDirectoryAsRouteMap(dirPath)
  return createServerFromRouteMap(apiVfs)
}
