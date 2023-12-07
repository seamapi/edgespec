import { createServer } from "node:http"
import { getRouteMatcher } from "next-route-matcher"
import {EdgeRuntime} from "edge-runtime"
import { normalizeRouteMap } from "../lib/normalize-route-map.js"

export const createServerFromRouteMap = async (routeMap) => {
  // We should use edge runtime here but it's currently broken:
  // https://github.com/vercel/edge-runtime/issues/716
  // const server = await createServer(
  //   transformToNode(async (req) => {
  //     // TODO Route to proper route handler
  //     return new primitives.Response(req.body)
  //     // return Object.values(routeMap)[0](req)
  //   }),
  // )

  const formattedRoutes = normalizeRouteMap(routeMap)

  const routeMatcher = getRouteMatcher(Object.keys(formattedRoutes))

  const server = createServer(async (nReq, nRes) => {
    const { matchedRoute, routeParams } = routeMatcher(nReq.url) ?? {}
    if (!matchedRoute) {
      nRes.statusCode = 404
      nRes.end("Not found")
      return
    }
    const routeFn = routeMap[formattedRoutes[matchedRoute]]

    try {
      const webReq = new Request(`http://localhost${nReq.url}`, {
        headers: nReq.headers,
        method: nReq.method,
        body: ["GET", "HEAD"].includes(nReq.method) ? undefined : nReq,
        duplex: "half",
      })

      const res = await routeFn(webReq)

      if (res.headers) {
        for (const [key, value] of Object.entries(res.headers)) {
          nRes.setHeader(key, value)
        }
      }

      nRes.statusCode = res.status ?? 200
      if (res.body instanceof ReadableStream) {
        for await (const chunk of res.body) {
          nRes.write(chunk)
        }
        nRes.end()
      } else {
        // If body is not a stream, write it directly
        nRes.end(res.body)
      }
    } catch (e) {
      nRes.statusCode = 500
      nRes.end(e.toString())
    }
  })

  return server
}
