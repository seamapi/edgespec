import { ExecutionContext } from "ava"
import path from "node:path"
import defaultAxios from "axios"
import { fileURLToPath } from "node:url"
import getPort from "@ava/get-port"
import { startDevServer } from "src/dev/dev-server"
import type { Middleware } from "src/middleware"

/**
 * Starts a dev server using the same function that's exported to consumers & used in the CLI.
 * Expects there to be an `api` directory that's a sibling of the test file.
 *
 * `testFileUrl` should be `import.meta.url` from the test file.
 */
export const getTestServer = async (
  t: ExecutionContext,
  testFileUrl: string,
  options?: {
    middlewares?: Middleware[]
  }
) => {
  const routesDirectory = path.join(
    path.dirname(fileURLToPath(testFileUrl)),
    "api"
  )

  const { stop, port } = await startDevServer({
    rootDirectory: path.join(routesDirectory, ".."),
    config: {
      routesDirectory,
    },
    port: await getPort(),
    middlewares: options?.middlewares,
  })

  t.teardown(async () => {
    await stop()
  })

  return {
    axios: defaultAxios.create({
      baseURL: `http://localhost:${port}`,
    }),
  }
}
