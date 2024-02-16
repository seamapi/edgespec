import { EdgeSpecRouteFn } from "src/types/web-handler.ts"

const getUser: EdgeSpecRouteFn = async (request) => {
  return Response.json({
    userId: request.routeParams.userId,
  })
}

export default getUser
