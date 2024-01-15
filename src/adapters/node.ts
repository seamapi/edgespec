import http from "node:http"
import { transformToNodeBuilder } from "src/edge-runtime/transform-to-node"

export const startServer = (edgeSpec: any, port?: number) => {
  const transformToNode = transformToNodeBuilder({
    defaultOrigin: `http://localhost${port ? `:${port}` : ""}`,
  })

  const server = http.createServer(
    transformToNode(async (fetchRequest) => {
      const { matchedRoute, routeParams } = edgeSpec.routeMatcher(
        new URL(fetchRequest.url).pathname
      )
      const handler = edgeSpec.routeMapWithHandlers[matchedRoute]
      ;(fetchRequest as Request & { pathParams?: any }).pathParams = routeParams

      const fetchResponse: Response = await handler(fetchRequest)

      return fetchResponse
    })
  )
  server.listen(port)

  return server
}
