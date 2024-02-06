# Programmatic Usage

Everything you can do through the CLI, you can do programmatically (and more!).

## Starting a dev server

The simple method:

```typescript
import { devServer } from "edgespec/dev"

// All properties are optional
devServer.startDevServer({
  configPath: "./edgespec.config.ts",
  config: {
    // Override something from your config file
  },
  port: 3000,
  onListening: (port) => {
    console.log(`Listening on port ${port}`)
  },
  onBuildStart: () => {
    console.log("Building...")
  },
  onBuildEnd: () => {
    console.log("Build complete")
  },
})
```

If you instead want to only run the bundler once but have multiple servers (useful in testing environments):

```typescript
import { EventEmitter } from "node:events"
import { loadConfig } from "edgespec/config"
import { devServer, HeadlessBuildEvents } from "edgespec/dev"

const config = await loadConfig("./edgespec.config.ts")

// This can be any compatible event emitter implementation
const headlessEventEmitter = new EventEmitter() as HeadlessBuildEvents

devServer.headless.startBundler({
  config,
  headlessEventEmitter,
})

// Can be run cheaply many times
const server = devServer.headless.startServer({
  port: 3000,
  config,
  headlessEventEmitter,
})

server.listen(3000)
```

## [Soon] codegen

## [Soon] bundling
