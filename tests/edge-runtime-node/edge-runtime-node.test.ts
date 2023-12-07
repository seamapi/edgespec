import test from "ava"

import { once } from "node:events"
import { createServer } from "node:http"
import { buildToNodeHandler } from "@edge-runtime/node-utils"
import * as primitives from "@edge-runtime/primitives"

// 1. builds a transformer, using Node.js@18 globals, and a base url for URL constructor.
const transformToNode = buildToNodeHandler(global as any, {
  defaultOrigin: "http://example.com",
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

  // 4. invoke the request handler
  const response = await fetch(`http://localhost:${server.address().port}`, {
    method: "POST",
    body: "hello world",
  })

  t.is(await response.text(), "hello world")
  await server.close()
})
