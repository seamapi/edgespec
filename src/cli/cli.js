#!/usr/bin/env node

import yargs from "yargs/yargs"
import { hideBin } from "yargs/helpers"
import { createServerFromDir } from "../serve/create-server-from-dir"

const argv = yargs(hideBin(process.argv))
  .scriptName("edgespec")
  .usage("$0 <cmd> [args]")
  .command(
    "serve",
    "start the server",
    (yargs) => {
      return yargs.positional("dir", {}).option("port", {
        default: "3000",
        alias: "p",
        type: "number",
      })
    },
    async (argv) => {
      console.log(
        `Starting edgespec server on http://localhost:${argv.port}...`,
      )
      const server = await createServerFromDir(argv._[1] ?? "./api")
      server.listen(argv.port ?? 3000)
    },
  )
  .command(
    "build [project_type]",
    "build a project",
    (yargs) => {
      return yargs.positional("project_type", {
        describe: "Type of project to build",
        choices: ["route-map", "next", "hono", "deno", "bun"],
      })
    },
    (argv) => {
      console.log(`Building project: ${argv.project}`)
      // Add build logic for 'next' or 'hono' here
    },
  )
  .help().argv
