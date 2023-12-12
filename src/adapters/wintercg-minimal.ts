export const addFetchListener = (edgeSpec: any) => {
  addEventListener("fetch", async (event) => {
    const {matchedRoute, routeParams} = edgeSpec.routeMatcher(new URL(event.request.url).pathname)
    const handler = edgeSpec.routeMapWithHandlers[matchedRoute]
    event.request.pathParams = routeParams
    event.respondWith(await handler(event.request))
  })
}
