export type HeadlessBuildEvents = {
  "started-building": () => void
  "finished-building": ({ bundlePath }: { bundlePath: string }) => void
}
