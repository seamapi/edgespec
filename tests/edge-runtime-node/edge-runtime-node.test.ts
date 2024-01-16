import test from "ava"

import { once } from "node:events"
import { createServer } from "node:http"
import { transformToNodeBuilder } from "src/edge-runtime/transform-to-node"

// 1. builds a transformer, using Node.js@18 globals, and a base url for URL constructor.
const transformToNode = transformToNodeBuilder({
  defaultOrigin: "https://example.com",
})

test("convert node server to standard web request server", async (t) => {
  const server = await createServer(
    // 2. takes an web compliant request handler, that uses Web globals like Request and Response,
    // and turn it into a Node.js compliant request handler.
    transformToNode(async (req: Request) => new Response(req.body))
  )

  // 3. start the node.js server
  server.listen()
  await once(server, "listening")

  const serverAddress = server.address()

  if (typeof serverAddress !== "object" || !serverAddress) {
    t.fail("server.address() should return an object")
    return
  }

  // 4. invoke the request handler
  const response = await fetch(`http://localhost:${serverAddress.port}`, {
    method: "POST",
    body: "hello world",
  })

  t.is(await response.text(), "hello world")
  await server.close()
})
