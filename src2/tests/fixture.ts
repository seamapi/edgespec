import { once } from "node:events"
import http from "node:http"
import path from "node:path"
import { AddressInfo } from "node:net"
import esbuild from "esbuild"
import * as edge from "edge-runtime"
import { createRouteMapFromDirectory } from "src2/routes/create-route-map-from-directory.ts"
import { generateWinterCGMinimalEntry } from "src2/targets/entries/wintercg-minimal"

interface StartTestFixtureFromDirectoryOptions {
  directoryPath: string
  port?: number
}

// todo: allow injecting env?
export const startTestFixtureFromDirectory = async ({directoryPath, port}: StartTestFixtureFromDirectoryOptions) => {
  const routeMap = await createRouteMapFromDirectory(directoryPath)

  const server = http.createServer(async (req, res) => {
    const routeFilePath = routeMap[req.url!]
    if (!routeFilePath) {
      res.statusCode = 404
      res.end()
      return
    }

    const result = await esbuild.build({
      stdin: {
        contents: generateWinterCGMinimalEntry(path.join(directoryPath, routeFilePath)),
        resolveDir: directoryPath,
        loader: "ts",
      },
      bundle: true,
      format: "esm",
      write: false
    })

    const runtime = new edge.EdgeRuntime({
      initialCode: result.outputFiles[0].text,
    })
    const fullUrl = `http://localhost:${req.socket.localPort}${req.url}`
    const response = await runtime.dispatchFetch(fullUrl, {
      method: req.method,
      headers: Object.entries(req.headers) as [string, string][],
      body: await new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = []
        req.on("data", (chunk) => chunks.push(chunk))
        req.on("end", () => resolve(Buffer.concat(chunks)))
        req.on("error", reject)
      })
    })
    await response.waitUntil()

    res.statusCode = response.status
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })
    res.end(await response.text())
  })
  server.listen(port)
  await once(server, "listening")

  return {
    port: (server.address() as AddressInfo).port,
    stop: async () => {},
  }
}
