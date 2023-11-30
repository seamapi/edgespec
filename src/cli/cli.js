#!/usr/bin/env node

import yargs from "yargs/yargs"
import { hideBin } from "yargs/helpers"
import { createServerFromDir } from "../serve/create-server-from-dir.js"
import { generateModuleCode } from "../codegen/generate-module-code.js"
import fs from "fs"

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
        `Starting edgespec server on http://localhost:${argv.port}...`
      )
      const server = await createServerFromDir(argv._[1] ?? "./api")
      server.listen(argv.port ?? 3000)
    }
  )
  .command(
    "build [project_type]",
    "build a project",
    (yargs) => {
      return yargs
        .option("project_type", {
          alias: "p",
          describe: "Type of project to build",
          choices: ["route-map", "module", "next", "hono", "deno", "bun"],
        })
        .option("routes", {
          alias: "r",
          description: "Routes directory (e.g. ./routes)",
        })
        .option("out-file", {
          alias: "o",
          description: "Output file (e.g. ./module.ts or ./route-map.ts)",
        })
    },
    async (argv) => {
      console.log(`Building project: ${argv.project_type}`)
      if (argv.project_type === "route-map" || argv.project_type === "module") {
        const code = await generateModuleCode(argv.routes ?? "./routes")
        fs.writeFileSync(argv.outFile ?? "./module.ts", code)
        return
      }
      throw new Error(`Unimplemented project type: "${argv.project_type}"`)
    }
  )
  .help().argv
