import { createWithEdgeSpec } from "src/create-with-edge-spec.js"
import axios from "axios"
import type { AxiosInstance } from "axios"
import getPort from "@ava/get-port"
import { createNodeServerFromRouteMap } from "src/serve/create-node-server-from-route-map.js"
import { ExecutionContext } from "ava"
import { once } from "events"
import { EdgeSpecOptions } from "src/types/edge-spec.ts"
import {
  GetAuthMiddlewaresFromGlobalSpec,
  GlobalSpec,
} from "src/types/global-spec.ts"
import { EdgeSpecRouteFnFromSpecs, RouteSpec } from "src/types/route-spec.ts"

export const getTestRoute = async <
  const GS extends GlobalSpec,
  const RS extends RouteSpec<GS>,
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

  return {
    serverUrl,
    axios: axios.create({
      baseURL: serverUrl,
    }),
  }
}
