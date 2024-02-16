import { EdgeSpecRequest, loadBundle } from "src/index.ts"

export default async (req: EdgeSpecRequest) => {
  const bundle = await loadBundle("./built-child.js")
  return bundle.makeRequest(req)
}
