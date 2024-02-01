import path from "node:path"
import { createRouteMapFromDirectory } from "src/routes/create-route-map-from-directory"

const alphabet = "zyxwvutsrqponmlkjihgfedcba"

const getRandomId = (length: number): string => {
  let str = ""
  let num = length
  while (num--) str += alphabet[(Math.random() * alphabet.length) | 0]
  return str
}

interface ConstructManifestOptions {
  routesDirectory: string
  bundledAdapter?: "wintercg-minimal"
}

export const constructManifest = async (options: ConstructManifestOptions) => {
  const routeMap = await createRouteMapFromDirectory(options.routesDirectory)

  const routes = Object.entries(routeMap).map(([route, { relativePath }]) => {
    return {
      route,
      relativePath,
      id: getRandomId(16),
    }
  })

  return `
import {getRouteMatcher} from "next-route-matcher"

${routes
  .map(
    ({ id, relativePath }) =>
      `import * as ${id} from "${path.resolve(
        path.join(options.routesDirectory, relativePath)
      )}"`
  )
  .join("\n")}

const routeMapWithHandlers = {
  ${routes.map(({ id, route }) => `"${route}": ${id}.default`).join(",")}
}

const edgeSpec = {
  routeMatcher: getRouteMatcher(Object.keys(routeMapWithHandlers)),
  routeMapWithHandlers
}

${
  options.bundledAdapter === "wintercg-minimal"
    ? `
import {addFetchListener} from "edgespec/adapters/wintercg-minimal"
addFetchListener(edgeSpec)
`
    : "export default edgeSpec"
}
  `.trim()
}
