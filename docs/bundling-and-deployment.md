# Bundling and deployment

Run `edgespec bundle -o dist/built.js`. Then, depending on your target:

### Node.js

Create an `entrypoint.mjs` file:

```js
import { startServer } from "edgespec/adapters/node"
import bundle from "./dist/built"

startServer(bundle, { port: 3000 })
```

### WinterCG (Cloudflare Workers/Vercel Edge Functions)

Create an `entrypoint.mjs` file:

```js
import { addFetchListener } from "edgespec/adapters/wintercg-minimal"
import bundle from "./dist/built"
addFetchListener(edgeSpec)
```

Because WinterCG doesn't allow `import`s, you'll need to bundle a second time with a tool like [tsup](https://github.com/egoist/tsup): `tsup entrypoint.mjs`.
