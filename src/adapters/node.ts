import http from "node:http"
import { transformToNodeBuilder } from "src/edge-runtime/transform-to-node"
import { EdgeSpecAdapter, handleRequestWithEdgeSpec } from "src/types/edge-spec"

export interface EdgeSpecNodeAdapterOptions {
  port?: number
}

export const startServer: EdgeSpecAdapter<[EdgeSpecNodeAdapterOptions]> = (
  edgeSpec,
  { port }
) => {
  const transformToNode = transformToNodeBuilder({
    defaultOrigin: `http://localhost${port ? `:${port}` : ""}`,
  })

  const server = http.createServer(
    transformToNode((req) => handleRequestWithEdgeSpec(edgeSpec, req))
  )
  server.listen(port)

  return server
}
