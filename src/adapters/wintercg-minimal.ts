import type { FetchEvent } from "@edge-runtime/primitives"

export const addFetchListener = (edgeSpec: any) => {
  addEventListener("fetch", async (event) => {
    // TODO: find better way to do this cast...
    const fetchEvent = event as unknown as FetchEvent

    const { matchedRoute, routeParams } = edgeSpec.routeMatcher(
      new URL(fetchEvent.request.url).pathname
    )
    const handler = edgeSpec.routeMapWithHandlers[matchedRoute]

    // TODO: make this a proper type
    ;(fetchEvent.request as Request & { pathParams?: any }).pathParams =
      routeParams

    fetchEvent.respondWith(await handler(fetchEvent.request))
  })
}
