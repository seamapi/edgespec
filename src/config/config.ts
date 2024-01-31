import { z } from "zod"

const edgeSpecConfigSchema = z
  .object({
    tsconfigPath: z.string().optional(),
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
