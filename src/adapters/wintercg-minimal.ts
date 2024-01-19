import { EdgeSpecAdapter, handleRequestWithEdgeSpec } from "src/types/edge-spec"
import { EdgeSpecFetchEvent } from "src/types/web-handler"

export const addFetchListener: EdgeSpecAdapter = (edgeSpec) => {
  addEventListener("fetch", async (event) => {
    // TODO: find a better way to cast this
    const fetchEvent = event as unknown as EdgeSpecFetchEvent

    fetchEvent.respondWith(
      await handleRequestWithEdgeSpec(edgeSpec)(fetchEvent.request)
    )
  })
}
