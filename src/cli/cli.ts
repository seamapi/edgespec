#!/usr/bin/env node
import { runExit } from "clipanion"
import { version } from "../../package.json"
import { BundleCommand } from "./commands/bundle"
import { DevCommand } from "./commands/dev"
import { CodeGenRouteTypes } from "./commands/codegen/route-types"

runExit(
  {
    binaryLabel: "EdgeSpec",
    binaryName: "edgespec",
    binaryVersion: version,
  },
  [BundleCommand, DevCommand, CodeGenRouteTypes]
)
