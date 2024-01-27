import { ExecutionContext } from "ava"
import path from "node:path"
import defaultAxios from "axios"
import { fileURLToPath } from "node:url"
import { startDevServer } from "src/dev/dev-server"

/**
 * Starts a dev server using the same function that's exported to consumers & used in the CLI.
 * Expects there to be an `api` directory that's a sibling of the test file.
 *
 * `testFileUrl` should be `import.meta.url` from the test file.
 */
export const getTestServer = async (
  t: ExecutionContext,
  testFileUrl: string
) => {
  const dir = path.join(path.dirname(fileURLToPath(testFileUrl)), "api")

  const { stop, port } = await startDevServer({
    config: {
      rootDirectory: path.join(dir, ".."),
      routesDirectory: dir,
      emulateWinterCG: true,
    },
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
