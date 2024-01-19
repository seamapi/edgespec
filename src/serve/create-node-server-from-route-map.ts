import { createServer } from "node:http"
import { getRouteMatcher } from "next-route-matcher"
import { normalizeRouteMap } from "../lib/normalize-route-map.js"
import {
  type TransformToNodeOptions,
  transformToNodeBuilder,
} from "src/edge-runtime/transform-to-node.js"
import { EdgeSpecRouteFn } from "src/types/web-handler.js"
import {
  EdgeSpecRouteBundle,
  EdgeSpecOptions,
  handleRequestWithEdgeSpec,
} from "src/types/edge-spec.js"

export const createEdgeSpecFromRouteMap = (
  routeMap: Record<string, EdgeSpecRouteFn>,
  edgeSpecOptions?: Partial<EdgeSpecOptions>
): EdgeSpecRouteBundle => {
  const formattedRoutes = normalizeRouteMap(routeMap)
  const routeMatcher = getRouteMatcher(Object.keys(formattedRoutes))

  const routeMapWithHandlers = Object.fromEntries(
    Object.entries(formattedRoutes).map(([routeFormatted, route]) => [
      routeFormatted,
      routeMap[route],
    ])
  )

  return {
    routeMatcher,
    routeMapWithHandlers,
    ...edgeSpecOptions,
  }
}

export const createNodeServerFromRouteMap = async (
  routeMap: Record<string, EdgeSpecRouteFn>,
  transformToNodeOptions: TransformToNodeOptions,
  edgeSpecOptions?: Partial<EdgeSpecOptions>
) => {
  const edgeSpec = createEdgeSpecFromRouteMap(routeMap, edgeSpecOptions)

  const transformToNode = transformToNodeBuilder(transformToNodeOptions)

  const server = createServer(
    transformToNode(handleRequestWithEdgeSpec(edgeSpec))
  )

  return server
}
