import { getMatchingFilePaths } from "make-vfs"
import path from "node:path"
import { normalizeRouteMap } from "../lib/normalize-route-map.js"

export const loadApiDirectoryAsRouteMap = async (dirPath) => {
  const filePaths = await getMatchingFilePaths({
    dirPath,
    extensions: ["ts"],
  })

  const routeMap = {}

  for (const filePath of filePaths) {
    routeMap[filePath] = (await import(path.resolve(dirPath, filePath))).default
  }

  return normalizeRouteMap(routeMap)
}
