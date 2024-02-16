#!/usr/bin/env node
import { runExit } from "clipanion"
import { version } from "../../package.json"
import { BundleCommand } from "./commands/bundle.ts"
import { DevCommand } from "./commands/dev.ts"
import { CodeGenRouteTypes } from "./commands/codegen/route-types.ts"

runExit(
  {
    binaryLabel: "EdgeSpec",
    binaryName: "edgespec",
    binaryVersion: version,
  },
  [BundleCommand, DevCommand, CodeGenRouteTypes]
)
