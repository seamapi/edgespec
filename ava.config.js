export default () => {
  return {
    files: ["**/*.test.ts"],
    ignoredByWatcher: [".next", ".nsm", "**/bundled*.*s"],
    environmentVariables: {
      // UPSTREAM: https://nodejs.org/docs/latest-v18.x/api/esm.html#loaders
      NODE_NO_WARNINGS: "1",
    },
    nodeArguments: ["--loader=tsx"],
    extensions: {
      ts: "module",
    },
  }
}
