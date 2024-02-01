import path from "node:path"
import fs from "node:fs/promises"

export const getTempPathInApp = async (rootDirectory: string) => {
  const tempDir = path.resolve(path.join(rootDirectory, ".edgespec"))
  await fs.mkdir(tempDir, { recursive: true })
  return tempDir
}
