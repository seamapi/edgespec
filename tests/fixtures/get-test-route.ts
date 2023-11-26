import * as STD from "src/std"
import { createWithEdgeSpec } from "src/create-with-edge-spec"
import type { AxiosInstance } from "axios"
import http from "node:http"
import getPort from "@ava/get-port"
import defaultAxios from "redaxios"
import { createServerFromRouteMap } from "src/serve/create-server-from-route-map"

export const getTestRoute = async (
  t: any,
  opts: {
    globalSpec: any
    routeSpec: any
    routePath: string
    routeFn: (req: STD.Request) => any
  },
): Promise<{ serverUrl: string; axios: AxiosInstance }> => {
  const withRouteSpec = createWithEdgeSpec(opts.globalSpec)

  const wrappedRouteFn = withRouteSpec(opts.routeSpec)(opts.routeFn)

  const port = await getPort()

  const app: any = await createServerFromRouteMap({
    [opts.routePath]: wrappedRouteFn,
  })

  // const app = http.createServer(async (nReq, nRes) => {
  //   try {
  //     const webReq = new Request(`http://localhost${nReq.url}`, {
  //       headers: nReq.headers as any,
  //       method: nReq.method,
  //       body: ["GET", "HEAD"].includes(nReq.method!)
  //         ? undefined
  //         : (nReq as any),
  //     })

  //     const res: Response = await wrappedRouteFn(webReq)
  //     nRes.statusCode = res.status ?? 200
  //     const json = res.json && (await res.json().catch((e) => null))
  //     const text = res.text && (await res.text().catch((e) => null))
  //     if (json) {
  //       nRes.setHeader("Content-Type", "application/json")
  //       nRes.end(JSON.stringify(json))
  //     } else if (text) {
  //       nRes.end(text)
  //     } else {
  //       throw new Error("Couldn't read response body")
  //     }
  //   } catch (e: any) {
  //     nRes.statusCode = 500
  //     nRes.end(e.toString())
  //   }
  // })

  app.listen(port)
  const serverUrl = `http://localhost:${port}`

  const axios: any = defaultAxios.create({
    baseURL: serverUrl,
  })

  return {
    serverUrl,
    axios,
  }
}
