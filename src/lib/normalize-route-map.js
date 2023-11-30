export const normalizeRouteMap = (routeMap) => {
  const normalizedRoutes = {}
  for (let route of Object.keys(routeMap)) {
    let routeWithSlash = route
    if (!route.startsWith("/")) {
      routeWithSlash = `/${route}`
    }
    normalizedRoutes[`${routeWithSlash.replace(/\.ts$/g, "")}`] = route
    if (route.endsWith("index.ts")) {
      normalizedRoutes[`${routeWithSlash.replace(/index\.ts$/g, "")}`] = route
    }
  }
  return normalizedRoutes
}
