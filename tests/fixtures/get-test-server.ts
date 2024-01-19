import { ExecutionContext } from "ava"
import path from "node:path"
import defaultAxios from "axios"
import { fileURLToPath } from "node:url"
import { startTestFixtureFromDirectory } from "src/tests/fixture"

export const getTestServer = async (
  t: ExecutionContext,
  testFileUrl: string
) => {
  const dir = path.join(path.dirname(fileURLToPath(testFileUrl)), "api")
  const { port, stop } = await startTestFixtureFromDirectory({
    directoryPath: dir,
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
