import * as STD from "src/std"
import { createWithEdgeSpec } from "src/create-with-edge-spec"
import type { AxiosInstance } from "axios"
import http from "node:http"
import getPort from "@ava/get-port"
import defaultAxios from "redaxios"

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

  const app = http.createServer(async (nReq, nRes) => {
    try {
      const webReq = new Request(`http://localhost${nReq.url}`, {
        headers: nReq.headers as any,
        method: nReq.method,
        body: ["GET", "HEAD"].includes(nReq.method!)
          ? undefined
          : (nReq as any),
      })

      const res: Response = await wrappedRouteFn(webReq)
      nRes.statusCode = res.status ?? 200
      console.log(res)
      console.log(res.text)
      nRes.end(res.body)
    } catch (e: any) {
      nRes.statusCode = 500
      nRes.end(e.toString())
    }
  })

  const port = await getPort()
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
