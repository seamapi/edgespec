import { Option } from "clipanion"
import fs from "node:fs/promises"
import { BaseCommand } from "src/cli/base-command.js"
import { ResolvedEdgeSpecConfig } from "src/config/utils.js"
import { extractRouteSpecsFromAST } from "src/lib/codegen/extract-route-specs-from-ast.js"

export class CodeGenRouteTypes extends BaseCommand {
  static paths = [[`codegen`, `route-types`]]

  outputPath = Option.String("--output,-o", {
    description: "Path to the output file",
    required: true,
  })

  async run(config: ResolvedEdgeSpecConfig) {
    const { project, routes, renderType } = await extractRouteSpecsFromAST({
      tsConfigFilePath: config.tsconfigPath,
      routesDirectory: config.routesDirectory,
    })

    project.createSourceFile(
      "manifest.ts",
      `
      import {z} from "zod"

      export type Routes = {
${routes
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
