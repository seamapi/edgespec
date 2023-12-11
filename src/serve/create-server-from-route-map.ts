import { createServer } from "node:http"
import { getRouteMatcher } from "next-route-matcher"
import { normalizeRouteMap } from "../lib/normalize-route-map.js"
// import { buildToNodeHandler } from "@edge-runtime/node-utils"
// import * as primitives from "@edge-runtime/primitives"

// const transformToNode = buildToNodeHandler(primitives, {
//   defaultOrigin: "http://example.com",
// })

export const createServerFromRouteMap = async (
  routeMap: Record<string, Function>
) => {
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
    if (!nReq.url) {
      nRes.statusCode = 400
      nRes.end("no url provided")
      return
    }

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
        body: ["GET", "HEAD"].includes(nReq.method ?? "") ? undefined : nReq,
        duplex: "half",
      } as any)

      const res = await routeFn(webReq)

      if (res.headers) {
        for (const [key, value] of Object.entries(res.headers)) {
          nRes.setHeader(key, value as any)
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
    } catch (e: any) {
      nRes.statusCode = 500
      nRes.end(e.toString())
    }
  })

  return server
}
