import { getMatchingFilePaths } from "make-vfs"

export const loadApiDirectoryAsRouteMap = async (dirPath) => {
  const filePaths = await getMatchingFilePaths({
    dirPath,
    extensions: ["ts"],
  })

  const routeMap = {}

  for (const filePath of filePaths) {
    routeMap[filePath] = await import(filePath)
  }

  return routeMap
}
