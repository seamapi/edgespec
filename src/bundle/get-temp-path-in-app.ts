import path from "node:path"
import fs from "node:fs/promises"

export const getTempPathInApp = async (appDirectory: string) => {
  const tempDir = path.resolve(path.join(appDirectory, "..", ".edgespec"))
  await fs.mkdir(tempDir, { recursive: true })
  return tempDir
}
