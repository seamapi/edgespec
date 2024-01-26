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
        // Temporary file created by bundle-require
        "**/edgespec.config.bundled*",
      ],
    },
    nodeArguments: ["--import=tsx"],
    extensions: {
      ts: "commonjs",
    },
  }
}
