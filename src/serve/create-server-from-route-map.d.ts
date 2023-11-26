export const createServerFromRouteMap = async (
  routeMap: Record<string, Function>,
) =>
  Promise<{
    listen: (port: number) => any
  }>
