# Programmatic Usage

Everything you can do through the CLI, you can do programmatically (and more!).

## Starting a dev server

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

## [Soon] codegen

## [Soon] bundling

## Advanced

When using a test runner, the default dev server has a major downside: all tests must share the same instance of the dev server, which prevents you from sharing context between tests and your application (assuming you want to run tests in parallel).

To fix this, you can use a "headless" dev server, which splits the bundling and serving into two separate functions, coupled by an event bus. This allows you to run the bundler once and share the bundle between multiple servers (usually, one server per test).

It's unlikely you'll need to use this API directly—check out [soon] supported test runners.

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
