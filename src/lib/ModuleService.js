import { normalizeRouteMap } from "./normalize-route-map.js"
import { getRouteMatcher } from "next-route-matcher"

class ModuleService {
  constructor(routeMap) {
    this.routeMap = routeMap
    this.normalizedRouteToRoute = normalizeRouteMap(routeMap)
    this.routeMatcher = getRouteMatcher(
      Object.keys(this.normalizedRouteToRoute)
    )
  }
  fetch(reqOrUrl, fetchOptions) {
    if (typeof reqOrUrl !== "string") {
      return this._fetchWithRequest(new Request(reqOrUrl, fetchOptions))
    }
    return this._fetchWithRequest(reqOrUrl)
  }
  _fetchWithRequest(req) {
    const { matchedRoute, routeParams } = this.routeMatcher(req.url) ?? {}
    if (!matchedRoute) {
      throw new Error("Not found") // TODO NotFoundError
    }
    // Add routeParams to request query params?
    const routeFn = this.routeMap[this.normalizedRouteToRoute[matchedRoute]]
    return routeFn(req)
  }
}
