import { once } from "node:events"
import http from "node:http"
import { AddressInfo } from "node:net"
import esbuild from "esbuild"
import * as edge from "edge-runtime"
import { createRouteMapFromDirectory } from "src2/routes/create-route-map-from-directory.ts"
import { generateWinterCGMinimalEntry } from "src2/targets/entries/wintercg-minimal"
import { bundle } from "src2/bundle/bundle"
import fs from "node:fs/promises"

interface StartTestFixtureFromDirectoryOptions {
  directoryPath: string
  port?: number
}

// todo: allow injecting env?
export const startTestFixtureFromDirectory = async ({directoryPath, port}: StartTestFixtureFromDirectoryOptions) => {
  const routeMap = await createRouteMapFromDirectory(directoryPath)

  const server = http.createServer(async (req, res) => {
    const chunks: Uint8Array[] = []
    req.on("data", (chunk) => chunks.push(chunk))
    await once(req, "end")
    const body = Buffer.concat(chunks)

    try {
      const bundled = await bundle({
        routeMap,
        directoryPath,
        bundledAdapter: "wintercg-minimal"
      })

      const runtime = new edge.EdgeRuntime({
        initialCode: bundled,
      })

      const fullUrl = `http://localhost:${req.socket.localPort}${req.url}`

      const response = await runtime.dispatchFetch(fullUrl, {
        method: req.method,
        headers: Object.entries(req.headers) as [string, string][],
        body: req.method === "GET" ? undefined : body,
      })
      await response.waitUntil()

      res.statusCode = response.status
      response.headers.forEach((value, key) => {
        res.setHeader(key, value)
      })
      res.end(await response.text())
    } catch (error) {
      res.statusCode = 500
      res.end(JSON.stringify({
        errorType: "emulated_wintercg_runtime_error",
        errorMessage: (error as Error).message,
        errorStack: (error as Error).stack,
      }))
    }
  })
  server.listen(port)
  await once(server, "listening")

  return {
    port: (server.address() as AddressInfo).port,
    stop: async () => {},
  }
}
