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
     * Emulate the WinterCG runtime. When true, native APIs are unavailable.
     *
     * Defaults to true.
     */
    emulateWinterCG: z.boolean().default(true).optional(),
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
