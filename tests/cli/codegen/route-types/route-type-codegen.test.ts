import test from "ava"
import { getTestCLI } from "tests/fixtures/get-test-cli"
import os from "node:os"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { fileURLToPath } from "node:url"

test("CLI codegen route-types command produces a bundle", async (t) => {
  const cli = await getTestCLI(t)

  const tempPath = path.join(os.tmpdir(), `${randomUUID()}.js`)
  const appDirectoryPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "api"
  )
  const execution = cli.executeCommand([
    "codegen",
    "route-types",
    // "-o",
    // tempPath,
    "--app-directory",
    appDirectoryPath,
  ])
  const result = await execution.waitUntilExit()
  t.is(result.exitCode, 0)
})
