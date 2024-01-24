export default () => {
  return {
    files: ["**/*.test.ts"],
    watchMode: {
      ignoreChanges: [
        ".next",
        ".nsm",
        "**/bundled*.*s",
        "**/api/**",
        "**/.edgespec/**",
      ],
    },
    nodeArguments: ["--import=tsx"],
    extensions: {
      ts: "commonjs",
    },
  }
}
