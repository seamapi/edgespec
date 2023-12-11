import http from "node:http"
import {once} from "node:events"

export const startServer = (edgeSpec: any, port?: number) => {
  const server = http.createServer(async (req, res) => {
    const chunks: Uint8Array[] = []
    req.on("data", (chunk) => chunks.push(chunk))
    await once(req, "end")
    const body = Buffer.concat(chunks)

    const fullUrl = `http://localhost:${req.socket.localPort}${req.url}`
    const fetchRequest = new Request(fullUrl, {
      method: req.method,
        headers: Object.entries(req.headers) as [string, string][],
        body: req.method === "GET" ? undefined : body,
    })

    const {matchedRoute, routeParams} = edgeSpec.routeMatcher(new URL(fetchRequest.url).pathname)
    const handler = edgeSpec.routeMapWithHandlers[matchedRoute]
    fetchRequest.pathParams = routeParams

    const fetchResponse: Response = await handler(fetchRequest)

    res.statusCode = fetchResponse.status
    fetchResponse.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })
    res.end(await fetchResponse.text())
  })
  server.listen(port)

  return server
}
