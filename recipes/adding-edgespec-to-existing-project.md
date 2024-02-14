# Adding EdgeSpec to an existing project

1. `npm add edgespec -D`
2. Add `.edgespec` to your `.gitignore`.
3. Create `edgespec.config.ts` at your project root:

```typescript
import { defineConfig } from "edgespec"

export default defineConfig({
  // This an example, adjust as needed
  routesDirectory: "./src/api",
})
```

4. Create `with-edge-spec.ts`:

```typescript
import { createWithEdgeSpec } from "edgespec"

export const withRouteSpec = createWithEdgeSpec({
  apiName: "An Example API",
  productionServerUrl: "https://example.com",
  beforeAuthMiddlewares: [],
  authMiddlewares: {},
})
```

5. Create a test API route in the directory you defined in `edgespec.config.ts`:

```typescript
// src/api/hello-world.ts
import { withRouteSpec } from "../with-edge-spec"

export default withRouteSpec({
  methods: ["GET"],
})(() => {
  return new Response("Hello, world!")
})
```

6. Add a script to your `package.json`:

```json
{
  "scripts": {
    "dev": "edgespec dev"
  }
}
```

7. Run `npm run dev` and visit `http://localhost:3000/hello-world` to see your API route!
