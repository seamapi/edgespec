import { startDevServer } from "./dev-server.ts"
import { startHeadlessDevBundler } from "./headless/start-bundler.ts"
import { startHeadlessDevServer } from "./headless/start-server.ts"

export const devServer = {
  startDevServer,
  headless: {
    startBundler: startHeadlessDevBundler,
    startServer: startHeadlessDevServer,
  },
}
