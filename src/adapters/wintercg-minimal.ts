import type { EdgeSpecAdapter } from "src/types/edge-spec"
import type { EdgeSpecFetchEvent } from "src/types/web-handler"

export const addFetchListener: EdgeSpecAdapter = (edgeSpec) => {
  addEventListener("fetch", async (event) => {
    // TODO: find a better way to cast this
    const fetchEvent = event as unknown as EdgeSpecFetchEvent

    fetchEvent.respondWith(await edgeSpec.makeRequest(fetchEvent.request))
  })
}
