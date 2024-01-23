import { ExecutionContext } from "ava"
import { execa } from "execa"
import { Writable } from "node:stream"

export const getTestCLI = async (t: ExecutionContext) => {
  return {
    executeCommand: (args: string[]) => {
      const logStream = new Writable({
        write(chunk) {
          t.log(chunk.toString())
        },
      })

      const command = execa(
        "node",
        ["--import=tsx", "src/cli/cli.ts", ...args],
        {
          reject: false,
        }
      ).pipeStderr!(logStream).pipeStdout!(logStream)

      t.teardown(() => {
        command.kill()
      })

      return {
        async kill() {
          command.kill()
          return await command
        },
        async waitUntilExit() {
          return await command
        },
      }
    },
  }
}
