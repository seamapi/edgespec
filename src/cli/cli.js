#!/usr/bin/env node

import yargs from "yargs/yargs"
import { hideBin } from "yargs/helpers"
import { createServerFromDir } from "../serve/create-server-from-dir.js"
import { generateModuleCode } from "../codegen/generate-module-code.js"
import fs from "fs"

const parseRes = yargs(hideBin(process.argv))
  .scriptName("edgespec")
  .usage("$0 <cmd> [args]")
  .command("serve", "start the server", (yargs) => {
    return yargs.positional("dir", {}).option("port", {
      default: "3000",
      alias: "p",
      type: "number",
    })
  })
  .command("build [project_type]", "build a project", (yargs) => {
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
  })

async function main() {
  const { argv } = parseRes
  if (argv._[0] === "build") {
    console.log(`Building project: ${argv.project_type}`)
    if (argv.project_type === "route-map" || argv.project_type === "module") {
      const code = await generateModuleCode(argv.routes ?? "./routes")
      fs.writeFileSync(argv.outFile ?? "./module.ts", code)
      process.exit(0)
    }
    throw new Error(`Unimplemented project type: "${argv.project_type}"`)
  } else if (argv._[0] === "serve") {
    console.log(`Starting edgespec server on http://localhost:${argv.port}...`)
    const server = await createServerFromDir(argv._[1] ?? "./api")
    console.log("listening...")
    server.listen(argv.port ?? 3000)
    console.log("waiting...")
    while (true) {
      // TODO check if server running
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  } else {
    parseRes.showHelp()
  }
}

main().catch((e) => {
  console.error(
    `Error while running edgespec CLI: ${e.toString()}\n\n${e.stack}`
  )
  process.exit(1)
})