import path from "node:path"
import { createRouteMapFromDirectory } from "src/routes/create-route-map-from-directory.js"
import { Project, Symbol, Type, TypeFormatFlags, ts } from "ts-morph"

const getZodTypeOfSymbol = (project: Project, symbol: Symbol | undefined) => {
  if (!symbol) return undefined

  const outerType = project
    .getTypeChecker()
    .getTypeOfSymbolAtLocation(symbol, symbol.getValueDeclarationOrThrow())

  const innerType = outerType.getProperty("_input")
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

type ExtractRouteSpecsFromASTOptions = {
  tsConfigFilePath: string
  routesDirectory: string
}

export const extractRouteSpecsFromAST = async ({
  tsConfigFilePath,
  routesDirectory,
}: ExtractRouteSpecsFromASTOptions) => {
  const project = new Project({
    compilerOptions: {
      declaration: true,
      noEmit: false,
      emitDeclarationOnly: true,
    },
    tsConfigFilePath,
  })

  const diagnostics = project.getPreEmitDiagnostics()
  if (diagnostics.length > 0) {
    console.error(project.formatDiagnosticsWithColorAndContext(diagnostics))
    throw new Error("Code generation failed (existing type errors)")
  }

  const routeMap = await createRouteMapFromDirectory(routesDirectory)

  const routes = Object.entries(routeMap).map(([route, { relativePath }]) => {
    const source = project.getSourceFileOrThrow(
      path.join(routesDirectory, relativePath)
    )

    const defaultExportDeclaration = source
      .getExportedDeclarations()
      .get("default")?.[0]
    if (!defaultExportDeclaration) {
      console.warn(`No default export found for ${route}`)
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

  const filteredRoutes = routes.filter(Boolean) as Exclude<
    (typeof routes)[number],
    undefined
  >[]

  const renderType = <TType extends ts.Type>(type: Type<TType>) => {
    return project
      .getTypeChecker()
      .compilerObject.typeToString(
        type.compilerType,
        undefined,
        TypeFormatFlags.NoTruncation
      )
  }

  return {
    routes: filteredRoutes,
    renderType,
    project,
  }
}
