import { getRouteMatcher } from "next-route-matcher"
import { normalizeRouteMap } from "./normalize-route-map.js"

export class ModuleService {
  private routeMap
  private normalizedRouteToRoute
  private routeMatcher

  constructor(routeMap: Record<string, Function>) {
    this.routeMap = routeMap
    this.normalizedRouteToRoute = normalizeRouteMap(routeMap)
    this.routeMatcher = getRouteMatcher(
      Object.keys(this.normalizedRouteToRoute)
    )
  }
  fetch(reqOrUrl: Request | string, fetchOptions?: RequestInit) {
    if (typeof reqOrUrl === "string") {
      return this._fetchWithRequest(
        new Request(`http://example.com${reqOrUrl}`, fetchOptions)
      )
    }
    return this._fetchWithRequest(reqOrUrl)
  }
  _fetchWithRequest(req: Request) {
    const pathname = new URL(req.url).pathname
    const { matchedRoute, routeParams } = this.routeMatcher(pathname) ?? {}
    if (!matchedRoute) {
      throw new Error("Not found") // TODO NotFoundError
    }
    // Add routeParams to request query params?
    const routeFn = this.routeMap[this.normalizedRouteToRoute[matchedRoute]]
    return routeFn(req)
  }
}
