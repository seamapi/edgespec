const health = async (request: Request) => {
  return Response.json({
    ok: true,
    foo: (request as any).foo,
  })
}

export default health
