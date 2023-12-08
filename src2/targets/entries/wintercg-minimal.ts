import { randomUUID } from "crypto"

const alphabet = "zyxwvutsrqponmlkjihgfedcba"

const getRandomId = (length: number): string => {
  let str = '';
  let num = length;
  while (num--) str += alphabet[Math.random() * alphabet.length | 0];
  return str;
}

export const generateWinterCGMinimalEntry = (routeMap: Record<string, string>): string => {
  const routes = Object.entries(routeMap).map(([route, filePath]) => {
    return {
      route,
      filePath,
      id: getRandomId(16)
    }
  })

  return `
    import {getRouteMatcher} from "next-route-matcher"

    ${routes.map(({id, filePath}) => `import * as ${id} from "./${filePath}"`).join("\n")}

    const routeMapWithHandlers = {
      ${routes.map(({id, route}) => `"${route}": ${id}.default`).join(",")}
    }

    const routeMatcher = getRouteMatcher(Object.keys(routeMapWithHandlers))

    addEventListener("fetch", async (event) => {
      const {matchedRoute, routeParams} = routeMatcher(new URL(event.request.url).pathname)
      const handler = routeMapWithHandlers[matchedRoute]
      event.respondWith(await handler(event.request))
    })
  `
}
