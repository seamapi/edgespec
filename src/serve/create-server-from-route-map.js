import { createServer } from "node:http"
import { getRouteMatcher } from "next-route-matcher"
// import { buildToNodeHandler } from "@edge-runtime/node-utils"
// import * as primitives from "@edge-runtime/primitives"

// const transformToNode = buildToNodeHandler(primitives, {
//   defaultOrigin: "http://example.com",
// })

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

  const formattedRoutes = {}
  for (const route of Object.keys(routeMap)) {
    formattedRoutes[`/${route.replace(/\.ts$/g, "")}`] = route
    if (route.endsWith("index.ts")) {
      formattedRoutes[`/${route.replace(/index\.ts$/g, "")}`] = route
    }
  }

  const routeMatcher = getRouteMatcher(Object.keys(formattedRoutes))

  const server = createServer(async (nReq, nRes) => {
    // TODO determine route!
    console.log(nReq.url)
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
