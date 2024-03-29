#!/usr/bin/env node
import { runExit } from "clipanion"
import { BundleCommand } from "./commands/bundle.js"
import { DevCommand } from "./commands/dev.js"
import { CodeGenRouteTypes } from "./commands/codegen/route-types.js"
import { CodeGenOpenAPI } from "./commands/codegen/openapi.js"

runExit(
  {
    binaryLabel: "EdgeSpec",
    binaryName: "edgespec",
  },
  [BundleCommand, DevCommand, CodeGenRouteTypes, CodeGenOpenAPI]
)
