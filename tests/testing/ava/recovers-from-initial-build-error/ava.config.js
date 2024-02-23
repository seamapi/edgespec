export default () => {
  return {
    files: [
      "tests/testing/ava/recovers-from-initial-build-error/test-to-spawn.ts",
    ],
    watchMode: {
      ignoreChanges: [
        "**/.edgespec/**",
        // Temporary file created by bundle-require
        "**/edgespec.config.bundled*",
      ],
    },
    nodeArguments: ["--import=tsx"],
    extensions: {
      ts: "commonjs",
    },
    environmentVariables: {
      IS_TESTING_EDGESPEC: "true",
    },
  }
}
