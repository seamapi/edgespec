import { createWithEdgeSpec } from "src/create-with-edge-spec.js"
import type { AxiosInstance } from "axios"
import getPort from "@ava/get-port"
import defaultAxios from "redaxios"
import { createNodeServerFromRouteMap } from "src/serve/create-node-server-from-route-map.js"
import { EdgeSpecRouteFn } from "src/types/web-handler"
import { ExecutionContext } from "ava"
import { once } from "events"
import { EdgeSpecOptions } from "src/types/edge-spec"
import {
  GetAuthMiddlewaresFromGlobalSpec,
  GlobalSpec,
} from "src/types/global-spec"
import { EdgeSpecRouteFnFromSpecs, RouteSpec } from "src/types/route-spec"

export const getTestRoute = async <
  const GS extends GlobalSpec,
  const RS extends RouteSpec<GetAuthMiddlewaresFromGlobalSpec<GS>>,
>(
  t: ExecutionContext,
  opts: {
    globalSpec: GS
    routeSpec: RS
    routePath: string
    routeFn: EdgeSpecRouteFnFromSpecs<GS, RS>
    edgeSpecOptions?: Partial<EdgeSpecOptions>
  }
): Promise<{ serverUrl: string; axios: AxiosInstance }> => {
  const withRouteSpec = createWithEdgeSpec(opts.globalSpec)

  const wrappedRouteFn = withRouteSpec(opts.routeSpec)(opts.routeFn)

  const port = await getPort()

  const app = await createNodeServerFromRouteMap(
    {
      [opts.routePath]: wrappedRouteFn,
    },
    {
      defaultOrigin: `http://localhost:${port}`,
    },
    opts.edgeSpecOptions
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
