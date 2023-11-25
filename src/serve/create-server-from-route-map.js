import { createServer } from "node:http"
import { buildToNodeHandler } from "@edge-runtime/node-utils"

const transformToNode = buildToNodeHandler(global, {
  defaultOrigin: "http://example.com",
})

export const createServerFromRouteMap = async (routeMap) => {
  const server = await createServer(
    transformToNode(async (req) => {
      // TODO Route to proper route handler
      return Object.values(routeMap)[0](req)
    }),
  )

  return server
}
