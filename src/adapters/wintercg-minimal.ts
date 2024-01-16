import { EdgeSpecFetchEvent } from "src/types/web-handler"

export const addFetchListener = (edgeSpec: any) => {
  addEventListener("fetch", async (event) => {
    // TODO: find a better way to cast this
    const fetchEvent = event as unknown as EdgeSpecFetchEvent

    const { matchedRoute, routeParams } = edgeSpec.routeMatcher(
      new URL(fetchEvent.request.url).pathname
    )
    const handler = edgeSpec.routeMapWithHandlers[matchedRoute]
    fetchEvent.request.pathParams = routeParams

    fetchEvent.respondWith(await handler(fetchEvent.request))
  })
}
