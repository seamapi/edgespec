import test from "ava"
import { getTestCLI } from "tests/fixtures/get-test-cli"
import os from "node:os"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { fileURLToPath } from "node:url"
import fs from "node:fs/promises"
import { Project } from "ts-morph"

test("CLI codegen route-types command produces the expected route types", async (t) => {
  const cli = await getTestCLI(t)

  const testFileDirectory = path.dirname(fileURLToPath(import.meta.url))

  const tempPath = path.join(os.tmpdir(), `${randomUUID()}.d.ts`)
  const appDirectoryPath = path.join(testFileDirectory, "api")
  const tsconfigPath = path.join(testFileDirectory, "tsconfig.json")
  const execution = cli.executeCommand([
    "codegen",
    "route-types",
    "-o",
    tempPath,
    "--routes-directory",
    appDirectoryPath,
    "--tsconfig",
    tsconfigPath,
  ])
  const cliResult = await execution.waitUntilExit()
  t.is(cliResult.exitCode, 0)

  // Test created file
  const routesDTs = await fs.readFile(tempPath, "utf-8")
  t.log("Generated file:")
  t.log(routesDTs)

  const project = new Project({
    compilerOptions: { strict: true },
  })

  project.createSourceFile("routes.ts", routesDTs)
  project.createSourceFile(
    "tests.ts",
    `
    import { expectTypeOf } from "expect-type"
    import {Routes} from "./routes"

    type ExpectedRoutes = {
      // Basic smoke test
      "/foo": {
        methods: "GET" | "POST"
        jsonResponse: {
          foo: {
            id: string
            name: string
          }
        }
        jsonBody: {
          foo_id: string
        }
      }
      // A route that imports part of its spec from /foo
      "/importer": {
        methods: "PUT"
        jsonResponse: {
          foo: {
            id: string
            name: string
          }
        }
      }
      // Route that uses z.union
      "/union": {
        methods: "GET" | "POST"
        jsonResponse: {
          foo_id: string
        } | boolean[]
        jsonBody: {
          foo_id: string
        }
      }
    }

    expectTypeOf<Routes>().toEqualTypeOf<ExpectedRoutes>()
  `
  )

  const diagnostics = project.getPreEmitDiagnostics()

  if (diagnostics.length > 0) {
    for (const diagnostic of diagnostics) {
      let message = diagnostic.getMessageText()
      message = typeof message === "string" ? message : message.getMessageText()

      t.log(
        `${diagnostic.getCategory()} ${message} (${diagnostic
          .getSourceFile()
          ?.getFilePath()}:${diagnostic.getLineNumber()})`
      )
    }

    t.fail(
      "Test TypeScript project using generated routes threw compile errors"
    )
  }

  t.pass()
})
