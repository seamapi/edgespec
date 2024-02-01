import getPort from "@ava/get-port"
import test from "ava"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pRetry from "p-retry"
import { getTestCLI } from "tests/fixtures/get-test-cli"

test("Config paths are resolved relative to config file", async (t) => {
  const cli = await getTestCLI(t)

  const configPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "edgespec.config.ts"
  )

  const port = await getPort()

  cli.executeCommand(["dev", "--config", configPath, "-p", port.toString()])

  await t.notThrowsAsync(async () => {
    await pRetry(
      async () => {
        const response = await fetch(`http://localhost:${port}/health`)
        if (response.status !== 200) {
          throw new Error("Server has not started yet")
        }
      },
      {
        retries: 10,
        minTimeout: 500,
        factor: 1,
      }
    )
  })
})
