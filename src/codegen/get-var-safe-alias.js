export const getVarSafeAlias = (s) => {
  return s.replace(/[^a-zA-Z0-9_]/g, "_")
}
