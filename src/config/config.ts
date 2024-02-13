import { z } from "zod"

const edgeSpecConfigSchema = z
  .object({
    /**
     * Defaults to the current working directory.
     */
    rootDirectory: z.string().optional(),
    /**
     * If this path is relative, it's resolved relative to the `rootDirectory` option.
     */
    tsconfigPath: z.string().optional(),
    /**
     * If this path is relative, it's resolved relative to the `rootDirectory` option.
     */
    routesDirectory: z.string().optional(),
    /**
     * The platform you're targeting.
     *
     * Defaults to "wintercg-minimal", and you should use this whenever possible for maximal compatibility.
     *
     * If you need to use native APIs in Node.js, Bun, or Deno, then set this to `node`.
     *
     * If this is unset or set to `wintercg-minimal`:
     * - route handlers will be run in an isolated environment when using the dev server to simulate edge environments
     * - `edgespec bundle` will produce a single file with no dependencies
     *
     * If this is set to `node`:
     * - route handlers will be run in the same environment as the main process when using the dev server
     * - `edgespec bundle` will allow use of native APIs (including imports from `node:*`)
     * - `edgespec bundle` **will not** bundle dependencies listed in `package.json`
     */
    platform: z
      .enum(["node", "wintercg-minimal"])
      .default("wintercg-minimal")
      .optional(),
  })
  .strict()

export type EdgeSpecConfig = z.infer<typeof edgeSpecConfigSchema>

export const defineConfig = (config: EdgeSpecConfig): EdgeSpecConfig => {
  const parsedConfig = edgeSpecConfigSchema.safeParse(config)

  if (parsedConfig.success) {
    return parsedConfig.data
  }

  throw new Error(`Invalid config: ${parsedConfig.error}`)
}
