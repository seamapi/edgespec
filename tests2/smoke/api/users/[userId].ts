// todo: shouldn't need to manually type this
type RequestWithParams = {
  pathParams: {
    userId: string
  }
} & Request

const getUser = async (request: RequestWithParams) => {
  return Response.json({
    userId: request.pathParams.userId,
  })
}

export default getUser
