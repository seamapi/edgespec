# Config

This file is not required, but if you want to globally override a CLI default you can create a file called `edgespec.config.ts` or `edgespec.config.js` at your project root.

Here's an example:

```ts
import { defineConfig } from "edgespec"

export default defineConfig({
  // This an example, adjust as needed
  routesDirectory: "./src/api",
})
```
