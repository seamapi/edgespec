export default () => {
  return {
    files: ["**/*.test.ts"],
    watchMode: {
      ignoreChanges: [".next", ".nsm", "**/bundled*.*s"],
    },
    nodeArguments: ["--import=tsx"],
    extensions: {
      ts: "commonjs",
    },
  }
}
