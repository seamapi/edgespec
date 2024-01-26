import { z } from "zod"

const edgeSpecConfigSchema = z
  .object({
    tsconfigPath: z.string().optional(),
    routesDirectory: z.string().optional(),
  })
  .strict()

export type EdgeSpecConfig = z.infer<typeof edgeSpecConfigSchema>

export interface ResolvedEdgeSpecConfig extends EdgeSpecConfig {
  tsconfigPath: string
  routesDirectory: string
}

export const defineConfig = (config: EdgeSpecConfig) => {
  const parsedConfig = edgeSpecConfigSchema.safeParse(config)

  if (parsedConfig.success) {
    return parsedConfig.data
  }

  throw new Error(`Invalid config: ${parsedConfig.error}`)
}
