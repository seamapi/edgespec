import {
  type EdgeSpecAdapter,
  type EdgeSpecRouteBundle,
  handleRequestWithEdgeSpec,
} from "src/types/edge-spec"
import {
  EdgeSpecInitializationOptions,
  EdgeSpecRequest,
  EdgeSpecRouteFn,
} from "src/types/web-handler"

export interface ModuleServiceOptions {
  routeParam?: string
  handleRouteParamNotFound?: EdgeSpecRouteFn
  allowMatchingOnAnyCatchAllRouteParam?: boolean
}

export type ModuleService = (options?: ModuleServiceOptions) => EdgeSpecRouteFn

export const createModuleService: EdgeSpecAdapter<[], ModuleService> = (
  moduleServiceEdgeSpec
) => {
  return (options) => async (request) => {
    // cascade options down the edge spec chain
    const edgeSpec: EdgeSpecRouteBundle = {
      ...request.edgeSpec,
      ...moduleServiceEdgeSpec,
      ...(options?.handleRouteParamNotFound && {
        handleModuleServiceRouteNotFound: options?.handleRouteParamNotFound,
      }),
    }

    const pathnameOverrideResult = getPathnameOverride(request, options ?? {})

    if ("failed" in pathnameOverrideResult) {
      return await pathnameOverrideResult.failed(request)
    }

    const response = await handleRequestWithEdgeSpec(edgeSpec, {
      pathnameOverride: pathnameOverrideResult.pathnameOverride,
    })(request)

    return response
  }
}

function getPathnameOverride(
  request: EdgeSpecRequest<EdgeSpecInitializationOptions>,
  options: ModuleServiceOptions
):
  | {
      pathnameOverride: string | undefined
    }
  | {
      failed: EdgeSpecRouteFn
    } {
  const {
    routeParam,
    handleRouteParamNotFound = request.edgeSpec
      .handleModuleServiceRouteNotFound ??
      (() => {
        throw new Error("Module service route not found!")
      }),
    allowMatchingOnAnyCatchAllRouteParam = true,
  } = options

  let paths: string[] | undefined

  if (routeParam) {
    const candidate = request.routeParams?.[routeParam]

    if (candidate && Array.isArray(candidate)) {
      paths = candidate
    }
  }

  if (!paths && allowMatchingOnAnyCatchAllRouteParam) {
    for (const routes of Object.values(request.routeParams ?? {})) {
      if (Array.isArray(routes)) {
        paths = routes
        break
      }
    }
  }

  if (!paths) {
    return { failed: handleRouteParamNotFound }
  }

  return { pathnameOverride: "/" + paths.join("/") }
}
