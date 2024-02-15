import { NodeHandler } from "@edge-runtime/node-utils"
import http from "node:http"
import { transformToNodeBuilder } from "src/edge-runtime/transform-to-node"
import type { Middleware } from "src/middleware"
import type { EdgeSpecAdapter } from "src/types/edge-spec"

export interface EdgeSpecNodeAdapterOptions {
  middleware?: Middleware[]
  port?: number
}

export const getNodeHandler: EdgeSpecAdapter<
  [EdgeSpecNodeAdapterOptions],
  NodeHandler
> = (edgeSpec, { port, middleware = [] }) => {
  const transformToNode = transformToNodeBuilder({
    defaultOrigin: `http://localhost${port ? `:${port}` : ""}`,
  })

  return transformToNode((req) =>
    edgeSpec.makeRequest(req, {
      middleware,
    })
  )
}

export const startServer: EdgeSpecAdapter<
  [EdgeSpecNodeAdapterOptions],
  Promise<http.Server>
> = async (edgeSpec, opts) => {
  const server = http.createServer(getNodeHandler(edgeSpec, opts))

  const { port } = opts

  await new Promise<void>((resolve) => server.listen(port, resolve))

  return server
}
