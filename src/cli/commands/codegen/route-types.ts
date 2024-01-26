import { Command, Option } from "clipanion"
import { Project, ts } from "ts-morph"
import path from "node:path"
import { createRouteMapFromDirectory } from "src/routes/create-route-map-from-directory"

export class CodeGenRouteTypes extends Command {
  static paths = [[`codegen`, `route-types`]]

  apiDirectory = Option.String(
    "--api-directory",
    path.join(process.cwd(), "api"),
    {
      description: "The directory to bundle",
    }
  )
  tsconfigPath = Option.String(
    "--tsconfig",
    path.join(process.cwd(), "tsconfig.json"),
    {
      description: "Path to the project's tsconfig.json",
    }
  )

  async execute() {
    const project = new Project({
      compilerOptions: { declaration: true },
      tsConfigFilePath: this.tsconfigPath,
    })

    const routeMap = await createRouteMapFromDirectory(this.apiDirectory)
    for (const { relativePath } of Object.values(routeMap)) {
      const source = project.getSourceFileOrThrow(
        path.join(this.apiDirectory, relativePath)
      )

      const defaultExportDeclaration = source
        .getExportedDeclarations()
        .get("default")?.[0]
      if (!defaultExportDeclaration) {
        continue
      }

      const callExpression = defaultExportDeclaration?.getChildrenOfKind(
        ts.SyntaxKind.CallExpression
      )[0]
      if (!callExpression) {
        continue
      }

      const callSignature = project
        .getTypeChecker()
        .compilerObject.getResolvedSignature(callExpression.compilerNode)
      if (!callSignature) {
        continue
      }

      const firstParameter = callSignature?.getParameters()?.[0]
      if (!firstParameter) {
        continue
      }
      const parameterType = project
        .getTypeChecker()
        .compilerObject.getTypeOfSymbolAtLocation(
          firstParameter,
          firstParameter.valueDeclaration!
        )
      console.log(
        "output",
        project
          .getTypeChecker()
          .compilerObject.typeToString(
            parameterType,
            undefined,
            ts.TypeFormatFlags.UseFullyQualifiedType |
              ts.TypeFormatFlags.UseStructuralFallback
          )
      )
    }

    const source = project.createSourceFile(
      "routes.ts",
      `
      import {z} from "zod"

      export type Routes = {
${Object.entries(routeMap)
  .map(([routeName, { relativePath }]) => {
    return `'${routeName}': Parameters<typeof import("./${relativePath}").default>`
  })
  .join("\n")}
}`
    )

    // const routesType = source.getTypeAliasOrThrow("Routes")
    // const routesType = source.getVariableDeclaration("TestRoute")
    // const routesTypeNode = checker.getTypeAtLocation(routesType!.compilerNode)

    // const callExpression = routesType?.getChildrenOfKind(ts.SyntaxKind.CallExpression)[0]
    // const callSignature = checker.getResolvedSignature(callExpression?.compilerNode!)
    // const parameters = callSignature?.getParameters()[0]
    // const parameterType = checker.getTypeOfSymbolAtLocation(parameters!, parameters!.valueDeclaration!)
    // // console.log(checker.typeToString(parameterType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.UseStructuralFallback))

    // const zodOutputType = parameterType.getProperty("_output")
    // console.log(checker.typeToString(checker.getTypeOfSymbol(zodOutputType!)))

    // for (const property of parameterType.getProperties()) {
    //   console.log(property.getName(), checker.typeToString(checker.getTypeOfSymbol(property), undefined, ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.UseStructuralFallback))
    // }

    // for (const property of routesTypeNode.getProperties()) {
    // const typeNode = checker.typeToTypeNode(checker.getTypeOfSymbol(property), undefined, undefined)

    // console.log(property.getName(), typeNode?.getChildren())

    // console.log(property.getName(), property.valueDeclaration?.getChildren())

    // console.log(property.getName(), checker.typeToString(checker.getTypeOfSymbol(property), undefined, ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.UseStructuralFallback))

    // console.log(typeNode?.getText())
    // }

    // transformTypeNode(routesType)

    // const deeplyResolve = (target: ts.Type) => {
    //   console.log("comment", target.getSymbol()?.getDocumentationComment(checker))
    //   for (const property of target.getProperties()) {
    //     // console.log(property.getName(), checker.typeToString(checker.getTypeOfSymbol(property), undefined, ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.UseStructuralFallback))
    //     // console.log("comment", property.getDocumentationComment(checker))
    //     // console.log(property.getName(), checker.typeToString(checker.getTypeOfSymbol(property), undefined, ts.TypeFormatFlags.UseFullyQualifiedType))
    //     // if (isTypeLocal(property)) {
    //     //   // deeplyResolve(checker.getTypeOfSymbol(property))
    //     // }

    //     const propertyType = checker.getTypeOfSymbol(property)
    //     console.log(propertyType.isClassOrInterface ? propertyType.ty)
    //   }
    // }

    // deeplyResolve(checker.getTypeAtLocation(routesType.compilerNode))
    // source.getDescendantsOfKind(SyntaxKind.ImportType).map((d) => {

    //   const checker = project.getTypeChecker().compilerObject.typeToTypeNode(d.compilerNode.getChildren()[0], undefined, {})
    //   console.log(checker)

    //   console.log(d.getType().getText())
    //   d.replaceWithText(d.getType().getText())
    // })

    console.log(source.getText())

    const result = project.emitToMemory({ emitOnlyDtsFiles: true })
    console.log(result.getFiles().map((f) => f.text.toString()))
  }
}
