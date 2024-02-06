import { startDevServer } from "./dev-server"
import { startHeadlessDevBundler } from "./headless/start-bundler"
import { startHeadlessDevServer } from "./headless/start-server"

export const devServer = {
  startDevServer,
  headless: {
    startBundler: startHeadlessDevBundler,
    startServer: startHeadlessDevServer,
  },
}
