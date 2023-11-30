import { loadApiDirectoryAsRouteMap } from "../build/load-api-directory-as-route-map.js"
import { createServerFromRouteMap } from "./create-server-from-route-map.js"

export const createServerFromDir = async (dirPath) => {
  const apiVfs = await loadApiDirectoryAsRouteMap(dirPath)
  return createServerFromRouteMap(apiVfs)
}
