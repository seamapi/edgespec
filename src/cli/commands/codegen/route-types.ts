import { Option } from "clipanion"
import { Project, Type, ts, Symbol, TypeFormatFlags } from "ts-morph"
import path from "node:path"
import fs from "node:fs/promises"
import { createRouteMapFromDirectory } from "src/routes/create-route-map-from-directory"
import { BaseCommand } from "src/cli/base-command"
import { ResolvedEdgeSpecConfig } from "src/config/utils"
import { normalizeRouteMap } from "src/lib/normalize-route-map"

export class CodeGenRouteTypes extends BaseCommand {
  static paths = [[`codegen`, `route-types`]]

  outputPath = Option.String("--output,-o", {
    description: "Path to the output file",
    required: true,
  })

  async run(config: ResolvedEdgeSpecConfig) {
    const project = new Project({
      compilerOptions: {
        declaration: true,
        noEmit: false,
        emitDeclarationOnly: true,
      },
      tsConfigFilePath: config.tsconfigPath,
    })

    const diagnostics = project.getPreEmitDiagnostics()
    if (diagnostics.length > 0) {
      this.context.stderr.write(
        project.formatDiagnosticsWithColorAndContext(diagnostics)
      )
      throw new Error("Type generation failed (existing type errors)")
    }

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

      return {
        route,
        httpMethods: httpMethodLiterals,
        jsonResponseZodOutputType: getZodTypeOfSymbol(
          project,
          parameterType.getProperty("jsonResponse")
        ),
        jsonBodyZodInputType: getZodTypeOfSymbol(
          project,
          parameterType.getProperty("jsonBody")
        ),
        commonParamsZodInputType: getZodTypeOfSymbol(
          project,
          parameterType.getProperty("commonParams")
        ),
        queryParamsZodInputType: getZodTypeOfSymbol(
          project,
          parameterType.getProperty("queryParams")
        ),
        urlEncodedFormDataZodInputType: getZodTypeOfSymbol(
          project,
          parameterType.getProperty("urlEncodedFormData")
        ),
      }
    })

    const filteredNodes = nodes.filter(Boolean) as Exclude<
      (typeof nodes)[number],
      undefined
    >[]

    const renderType = <TType extends ts.Type>(type: Type<TType>) => {
      return project
        .getTypeChecker()
        .compilerObject.typeToString(type.compilerType)
    }

    project.createSourceFile(
      "manifest.ts",
      `
      import {z} from "zod"

      export type Routes = {
${filteredNodes
  .map(
    ({
      route,
      httpMethods,
      jsonResponseZodOutputType,
      jsonBodyZodInputType,
      commonParamsZodInputType,
      queryParamsZodInputType,
      urlEncodedFormDataZodInputType,
    }) => {
      return `  "${route}": {
    route: "${route}"
    method: ${httpMethods.map((m) => `"${m}"`).join(" | ")}
    ${
      jsonResponseZodOutputType
        ? `jsonResponse: ${renderType(jsonResponseZodOutputType)}`
        : ""
    }
    ${
      jsonBodyZodInputType
        ? `jsonBody: ${renderType(jsonBodyZodInputType)}`
        : ""
    }
    ${
      commonParamsZodInputType
        ? `commonParams: ${renderType(commonParamsZodInputType)}`
        : ""
    }
    ${
      queryParamsZodInputType
        ? `queryParams: ${renderType(queryParamsZodInputType)}`
        : ""
    }
    ${
      urlEncodedFormDataZodInputType
        ? `urlEncodedFormData: ${renderType(urlEncodedFormDataZodInputType)}`
        : ""
    }
  }`
    }
  )
  .join("\n")}
  }`
    )

    const result = project.emitToMemory({ emitOnlyDtsFiles: true })
    await fs.writeFile(
      this.outputPath,
      result.getFiles().find((f) => f.filePath.includes("/manifest.d.ts"))!.text
    )
  }
}

function getZodTypeOfSymbol(project: Project, symbol: Symbol | undefined) {
  if (!symbol) return undefined

  const outerType = project
    .getTypeChecker()
    .getTypeOfSymbolAtLocation(symbol, symbol.getValueDeclarationOrThrow())

  const innerType = outerType.getProperty("_output")
  if (!innerType) {
    throw new Error(`${symbol.getName()} must be a zod schema`)
  }

  return project
    .getTypeChecker()
    .getTypeOfSymbolAtLocation(
      innerType,
      innerType.getValueDeclarationOrThrow()
    )
}
