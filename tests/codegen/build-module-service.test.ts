import { generateModuleCode } from "src/codegen/generate-module-code.js"
import test from "ava"

test("test generating module code", async (t) => {
  const code = await generateModuleCode("./examples/hello-world/routes")
  t.truthy(code.includes("export const routeMap"))
  t.truthy(code.includes("export const GeneratedService"))
  t.truthy(code.includes("new ModuleService(routeMap)"))
})
