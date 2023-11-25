#!/usr/bin/env node

import yargs from "yargs/yargs"
import { hideBin } from "yargs/helpers"

const argv = yargs(hideBin(process.argv))
  .scriptName("edgespec")
  .usage("$0 <cmd> [args]")
  .command(
    "serve",
    "start the server",
    () => {},
    (argv) => {
      console.log("Starting the server...")
      // Add server starting logic here
    },
  )
  .command(
    "build [project_type]",
    "build a project",
    (yargs) => {
      return yargs.positional("project_type", {
        describe: "Type of project to build",
        choices: ["routemap", "next", "hono", "deno", "bun"],
      })
    },
    (argv) => {
      console.log(`Building project: ${argv.project}`)
      // Add build logic for 'next' or 'hono' here
    },
  )
  .help().argv
