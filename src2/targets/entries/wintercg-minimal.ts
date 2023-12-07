export const generateWinterCGMinimalEntry = (handlerPath: string): string => {
  return `
    import handler from "${handlerPath}"

    if (typeof handler !== "function") {
      throw new Error("Handler must be a function")
    }

    addEventListener("fetch", async (event) => {
      event.respondWith(await handler(event.request))
    })
  `
}
