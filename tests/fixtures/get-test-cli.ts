import { ExecutionContext } from "ava"
import { execa } from "execa"

export const getTestCLI = async (t: ExecutionContext) => {
  return {
    executeCommand: async (args: string[]) => {
      const result = await execa(
        "node",
        ["--import=tsx", "src/cli/cli.ts", ...args],
        {
          reject: false,
        }
      )
      t.log(result.stderr)
      t.log(result.stdout)
      return result
    },
  }
}
