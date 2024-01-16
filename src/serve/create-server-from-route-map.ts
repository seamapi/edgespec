import { createServer } from "node:http"
import { getRouteMatcher } from "next-route-matcher"
import { normalizeRouteMap } from "../lib/normalize-route-map.js"
import {
  type TransformToNodeOptions,
  transformToNodeBuilder,
} from "src/edge-runtime/transform-to-node.js"
import { EdgeSpecRouteFn } from "src/types/web-handler.js"

export const createServerFromRouteMap = async (
  routeMap: Record<string, EdgeSpecRouteFn>,
  transformToNodeOptions: TransformToNodeOptions
) => {
  const formattedRoutes = normalizeRouteMap(routeMap)

  const routeMatcher = getRouteMatcher(Object.keys(formattedRoutes))

  const transformToNode = transformToNodeBuilder(transformToNodeOptions)

  const server = createServer(
    transformToNode(async (req) => {
      // TODO: put routeParams on request object...
      const { matchedRoute, routeParams } =
        routeMatcher(new URL(req.url).pathname) ?? {}
      const routeFn =
        matchedRoute &&
        formattedRoutes[matchedRoute] &&
        routeMap[formattedRoutes[matchedRoute]]

      if (!matchedRoute || !routeFn) {
        console.log({
          matchedRoute,
          formattedRoutes,
          routeMap,
          url: req.url,
          transformToNodeOptions,
        })
        return new Response("Not found", {
          status: 404,
        })
      }

      try {
        return await routeFn(req)
      } catch (e: any) {
        return new Response(e.toString(), {
          status: 500,
        })
      }
    })
  )

  return server
}
