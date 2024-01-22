#!/usr/bin/env node
import { runExit } from "clipanion"
import { BundleCommand } from "./commands/bundle"
import { DevCommand } from "./commands/dev"
import { version } from "../../package.json"

runExit(
  {
    binaryLabel: "EdgeSpec",
    binaryName: "edgespec",
    binaryVersion: version,
  },
  [BundleCommand, DevCommand]
)
