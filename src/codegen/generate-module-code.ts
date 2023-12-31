import { getMatchingFilePaths } from "make-vfs"
import path from "path"
import { getVarSafeAlias } from "./get-var-safe-alias.js"

export const generateModuleCode = async (dirPath: string) => {
  const filePaths = await getMatchingFilePaths({
    dirPath,
    extensions: ["ts"],
  })

  const routeVarNameMap: Record<string, string> = {}
  for (const filePath of filePaths) {
    routeVarNameMap[filePath] = getVarSafeAlias(filePath)
  }

  let code: string[] = []
  code.push("// This file is generated. Do not edit it directly.\n")
  code.push(`import { ModuleService } from "edgespec"\n`)
  code.push("// Route Imports")
  for (const filePath of filePaths) {
    code.push(
      `import ${routeVarNameMap[filePath]} from "./${path.relative(
        process.cwd(),
        path.join(dirPath, filePath)
      )}"`
    )
  }

  code.push("\n\n")

  code.push("// Route Map Definition")
  code.push(
    `export const routeMap = {\n${Object.entries(routeVarNameMap)
      .map(([filePath, varName]) => {
        return `  "${filePath}": ${varName}`
      })
      .join(",\n")}\n}`
  )

  code.push("\n\n")

  code.push("// Module Definition")
  code.push(
    `export const GeneratedService = {`,
    "  create: () => new ModuleService(routeMap)",
    "}",
    "export default GeneratedService"
  )

  return code.join("\n")
}
