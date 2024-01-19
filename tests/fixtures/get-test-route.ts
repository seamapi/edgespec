import { createWithEdgeSpec } from "src/create-with-edge-spec.js"
import type { AxiosInstance } from "axios"
import getPort from "@ava/get-port"
import defaultAxios from "redaxios"
import { createServerFromRouteMap } from "src/serve/create-server-from-route-map.js"
import { EdgeSpecRouteFn } from "src/types/web-handler"
import { ExecutionContext } from "ava"
import { once } from "events"

export const getTestRoute = async (
  t: ExecutionContext,
  opts: {
    globalSpec: any
    routeSpec: any
    routePath: string
    routeFn: EdgeSpecRouteFn
  }
): Promise<{ serverUrl: string; axios: AxiosInstance }> => {
  const withRouteSpec = createWithEdgeSpec(opts.globalSpec)

  const wrappedRouteFn = withRouteSpec(opts.routeSpec)(opts.routeFn)

  const port = await getPort()

  const app = await createServerFromRouteMap(
    {
      [opts.routePath]: wrappedRouteFn,
    },
    {
      defaultOrigin: `http://localhost:${port}`,
    }
  )

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
  t.teardown(async () => {
    const closePromise = once(app, "close")
    app.close()
    return closePromise
  })
  const serverUrl = `http://localhost:${port}`

  const axios: any = defaultAxios.create({
    baseURL: serverUrl,
  })

  return {
    serverUrl,
    axios,
  }
}
