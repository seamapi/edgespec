export const getVarSafeAlias = (s: string) => {
  return s.replace(/[^a-zA-Z0-9_]/g, "_")
}
