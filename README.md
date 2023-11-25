# edgespec

Edgespec is a way of writing [WinterCG-compatible](https://wintercg.org/) APIs
that work with different HTTP frameworks.

Using edgespec:

- Endpoints that work anywhere (Cloudflare Workers, Hono, Vercel, NextJS)
- Generate ergonomic multi-language SDKs
- Automatically generate OpenAPI documentation and validate request/response payloads
- Automatically validate requests and responses
- Easily create short-lived test servers for testing

## Getting Started

```
npm install edgespec

npx edgespec serve
```

## Building for Deployment

You can build configurations for different frameworks so that your edgespec app
is portable. For example:

- `edgespec build next.config.js`
- `edgespec build hono-app.ts`

## File-Routing

By default, `edgespec` searches inside your `./api` directory for endpoints
using the NextJS `pages/api` file routing standard. It looks a bit like this:

- `/api/health.ts`
- `/api/resource/[id].ts`
- `/api/resource/[id]/actions/[...action].ts`

## Development

The types are separated from the source javascript files in this project,
eliminating the need for a transpiler. This was done because the types present
a significant amount of complexity, so we intentionally separated the
implementation from the types.

You can run the tests with ava, to run a specific test file use:

```bash
npx ava ./tests/endpoints/basic.test.ts
```

To run the entire test suite use `npm run test`
