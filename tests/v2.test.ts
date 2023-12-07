import test from "ava"
import {startTestFixtureFromDirectory} from "src2/tests/fixture.ts"
import { fileURLToPath } from "url"
import path from "node:path"
import axios from "axios"

test("v2", async t => {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "sample")
  const {port, stop} = await startTestFixtureFromDirectory({directoryPath: dir})
  t.teardown(async () => {
    await stop()
  })

  const response = await axios.post(`http://localhost:${port}/health`, {
    foo: "bar"
  }, {
    headers: {
      "x-foo": "bar"
    }
  })

  t.like(response.data, {
    method: "POST",
    body: {
      foo: "bar"
    },
    headers: {
      "x-foo": "bar"
    },
  })
})
