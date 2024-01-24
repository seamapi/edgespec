import { getMatchingFilePaths } from "make-vfs"

export const createRouteMapFromDirectory = async (
  directoryPath: string
): Promise<Record<string, { relativePath: string }>> => {
  const filePaths = await getMatchingFilePaths({
    dirPath: directoryPath,
    extensions: ["ts"],
  })

  const routes: Record<string, { relativePath: string }> = {}
  for (let path of filePaths) {
    let routeWithSlash = path
    if (!path.startsWith("/")) {
      routeWithSlash = `/${path}`
    }
    routes[`${routeWithSlash.replace(/\.ts$/g, "")}`] = {
      relativePath: path,
    }

    if (path.endsWith("index.ts")) {
      routes[`${routeWithSlash.replace(/index\.ts$/g, "")}`] = {
        relativePath: path,
      }
    }
  }

  return routes
}
