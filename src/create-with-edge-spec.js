export const createWithEdgeSpec = (globalSpec) => {
  return (routeSpec) => (routeFn) => async (req, _res) => {
    // Identify environment this is being executed in and convert to WinterCG-
    // compatible request

    // Execute middleware + auth middleware etc.
    for (const auth_method of route_spec.auth ?? []) {
      // ...
    }

    try {
      return await routeFn(req)
    } catch (e) {
      // Use exception handling middleware to handle failure
    }
  }
}
