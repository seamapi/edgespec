#!/usr/bin/env node

const yargs = require("yargs/yargs")
const { hideBin } = require("yargs/helpers")

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
    "build [project]",
    "build a project",
    (yargs) => {
      return yargs.positional("project", {
        describe: "name of the project to build",
        choices: ["next", "hono"],
      })
    },
    (argv) => {
      console.log(`Building project: ${argv.project}`)
      // Add build logic for 'next' or 'hono' here
    },
  )
  .help().argv
