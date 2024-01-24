import { Command, Option } from "clipanion"
import { Project, SyntaxKind } from "ts-morph"
import path from "node:path"
import fs from "node:fs/promises"
import { createRouteMapFromDirectory } from "src/routes/create-route-map-from-directory"

export class CodeGenRouteTypes extends Command {
  static paths = [[`codegen`, `route-types`]]

  appDirectory = Option.String("--app-directory", process.cwd(), {
    description: "The directory to bundle",
  })

  async execute() {
    const project = new Project({ compilerOptions: { declaration: true } })

    const routeMap = await createRouteMapFromDirectory(this.appDirectory)
    for (const { relativePath } of Object.values(routeMap)) {
      project.createSourceFile(
        relativePath,
        await fs.readFile(path.join(this.appDirectory, relativePath), "utf-8")
      )
    }

    const source = project.createSourceFile(
      "routes.ts",
      `export type Routes = {
${Object.entries(routeMap)
  .map(([routeName, { relativePath }]) => {
    return `'${routeName}': Parameters<typeof import("./${relativePath}").default>`
  })
  .join("\n")}
}`
    )

    // const routesType = source.getTypeAliasOrThrow("Routes")

    source.getDescendantsOfKind(SyntaxKind.ImportType).map((d) => {

      const checker = project.getTypeChecker()

      console.log(d.getType().getText())
      d.replaceWithText(d.getType().getText())
    })

    console.log(source.getText())

    const result = project.emitToMemory({ emitOnlyDtsFiles: true })
    console.log(result.getFiles().map((f) => f.text.toString()))
  }
}
