import { Option } from "clipanion"
import { Project, Type, ts } from "ts-morph"
import path from "node:path"
import fs from "node:fs/promises"
import { createRouteMapFromDirectory } from "src/routes/create-route-map-from-directory"
import { BaseCommand } from "src/cli/base-command"
import { ResolvedEdgeSpecConfig } from "src/config/utils"

export class CodeGenRouteTypes extends BaseCommand {
  static paths = [[`codegen`, `route-types`]]

  outputPath = Option.String("--output,-o", {
    description: "Path to the output file",
    required: true,
  })

  async run(config: ResolvedEdgeSpecConfig) {
    const project = new Project({
      compilerOptions: { declaration: true },
      tsConfigFilePath: config.tsconfigPath,
    })

    const routeMap = await createRouteMapFromDirectory(config.routesDirectory)

    const nodes = Object.entries(routeMap).map(([route, { relativePath }]) => {
      const source = project.getSourceFileOrThrow(
        path.join(config.routesDirectory, relativePath)
      )

      const defaultExportDeclaration = source
        .getExportedDeclarations()
        .get("default")?.[0]
      if (!defaultExportDeclaration) {
        return
      }

      const callExpression = defaultExportDeclaration?.getChildrenOfKind(
        ts.SyntaxKind.CallExpression
      )[0]
      if (!callExpression) {
        return
      }

      const callSignature = project
        .getTypeChecker()
        .getResolvedSignature(callExpression)
      if (!callSignature) {
        return
      }

      const firstParameter = callSignature?.getParameters()?.[0]
      if (!firstParameter) {
        return
      }
      const parameterType = project
        .getTypeChecker()
        .getTypeOfSymbolAtLocation(
          firstParameter,
          firstParameter.getValueDeclarationOrThrow()
        )

      const httpMethodsSymbol = parameterType.getProperty("methods")
      if (!httpMethodsSymbol) {
        return
      }

      const httpMethodLiterals = httpMethodsSymbol
        .getValueDeclarationOrThrow()
        .getDescendantsOfKind(ts.SyntaxKind.StringLiteral)
        .map((d) => d.getLiteralText())

      const jsonResponseSymbol = parameterType.getProperty("jsonResponse")
      let jsonResponseZodOutputType: Type | undefined = undefined
      if (jsonResponseSymbol) {
        const jsonResponseType = project
          .getTypeChecker()
          .getTypeOfSymbolAtLocation(
            jsonResponseSymbol,
            jsonResponseSymbol.getValueDeclarationOrThrow()
          )

        const jsonResponseZodOutputSymbol =
          jsonResponseType.getProperty("_output")
        if (!jsonResponseZodOutputSymbol) {
          throw new Error("jsonResponse must be a zod schema")
        }

        jsonResponseZodOutputType = project
          .getTypeChecker()
          .getTypeOfSymbolAtLocation(
            jsonResponseZodOutputSymbol,
            jsonResponseZodOutputSymbol.getValueDeclarationOrThrow()
          )
      }

      return {
        route,
        httpMethods: httpMethodLiterals,
        jsonResponseZodOutputType,
      }
    })

    const filteredNodes = nodes.filter(Boolean) as Exclude<
      (typeof nodes)[number],
      undefined
    >[]

    project.createSourceFile(
      "manifest.ts",
      `
      import {z} from "zod"

      export type Routes = {
${filteredNodes
  .map(({ route, httpMethods, jsonResponseZodOutputType }) => {
    return `  "${route}": {
    methods: ${httpMethods.map((m) => `"${m}"`).join(" | ")}
    ${
      jsonResponseZodOutputType
        ? `jsonResponse: ${project
            .getTypeChecker()
            .compilerObject.typeToString(
              jsonResponseZodOutputType.compilerType
            )}`
        : ""
    }
  }`
  })
  .join("\n")}`
    )

    const result = project.emitToMemory({ emitOnlyDtsFiles: true })
    await fs.writeFile(
      this.outputPath,
      result.getFiles().find((f) => f.filePath.includes("/manifest.d.ts"))!.text
    )
  }
}
