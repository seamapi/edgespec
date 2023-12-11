import test from "ava"
import { bundle } from "src/bundle/bundle"
import path from "node:path"
import fs from "node:fs/promises"
import { fileURLToPath } from "node:url"
import {execa} from "execa"
import getPort from "@ava/get-port"
import pRetry from "p-retry"
import axios from "axios"
import { once } from "node:events"

test("test bundle with Node adapter", async t => {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

  const bundled = await bundle({
    directoryPath: path.join(currentDirectory, "api"),
  })

  const port = await getPort()

  const bundlePath = path.join(currentDirectory, "bundled.js")
  const bundleEntrypointPath = path.join(currentDirectory, "bundled.entrypoint.mjs")
  await fs.writeFile(bundlePath, bundled, "utf-8")
  await fs.writeFile(bundleEntrypointPath, `
    import {startServer} from "../../dist/adapters/node.js"
    import bundle from "./bundled.js"

    startServer(bundle, ${port})
  `, "utf-8")

  const cmd = execa("node", [bundleEntrypointPath])
  t.teardown(async () => {
    const waitForExit = once(cmd, "exit")
    cmd.kill('SIGTERM')
    await waitForExit
  })

  await pRetry(async () => {
    const response = await axios.get(`http://localhost:${port}/health`)
    t.deepEqual(response.data, {
      ok: true
    })
  })

  t.pass()
})
