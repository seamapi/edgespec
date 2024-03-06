import { Option } from "clipanion"
import fs from "node:fs/promises"
import {
  OpenApiBuilder,
  OperationObject,
  ParameterObject,
} from "openapi3-ts/oas31"
import { BaseCommand } from "src/cli/base-command.js"
import { ResolvedEdgeSpecConfig } from "src/config/utils.js"
import { extractRouteSpecsFromAST } from "src/lib/codegen/extract-route-specs-from-ast.js"
import { ts } from "ts-morph"

export class CodeGenOpenAPI extends BaseCommand {
  static paths = [[`codegen`, `openapi`]]

  outputPath = Option.String("--output,-o", {
    description: "Path to the output file",
    required: true,
  })

  async run(config: ResolvedEdgeSpecConfig) {
    const { project, routes, globalRouteSpecType } =
      await extractRouteSpecsFromAST({
        tsConfigFilePath: config.tsconfigPath,
        routesDirectory: config.routesDirectory,
      })

    const openapiProperty = globalRouteSpecType.getProperty("openapi")
    if (!openapiProperty) {
      throw new Error("foo")
    }

    const openapiType = project
      .getTypeChecker()
      .getTypeOfSymbolAtLocation(
        openapiProperty,
        openapiProperty?.getValueDeclarationOrThrow()
      )

    const getStringLiteralPropertyFromOpenAPIDef = (propertyName: string) =>
      openapiType
        .getProperty(propertyName)
        ?.getValueDeclarationOrThrow()
        .getDescendantsOfKind(ts.SyntaxKind.StringLiteral)[0]
        .getLiteralText()

    const apiName = getStringLiteralPropertyFromOpenAPIDef("apiName")
    const productionServerUrl = getStringLiteralPropertyFromOpenAPIDef(
      "productionServerUrl"
    )

    const builder = new OpenApiBuilder({
      openapi: "3.0.0",
      info: {
        title: apiName ?? "EdgeSpec API",
        version: "1.0.0", // todo
      },
      ...(productionServerUrl
        ? {
            servers: [
              {
                url: productionServerUrl,
              },
            ],
          }
        : {}),
    })

    await fs.writeFile(this.outputPath, builder.getSpecAsJson(undefined, 2))
  }
}
