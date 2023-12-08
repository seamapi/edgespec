import esbuild from "esbuild"

const alphabet = "zyxwvutsrqponmlkjihgfedcba"

const getRandomId = (length: number): string => {
  let str = '';
  let num = length;
  while (num--) str += alphabet[Math.random() * alphabet.length | 0];
  return str;
}

interface BundleOptions {
  routeMap: Record<string, string>
  directoryPath: string,
  /**
   * This should not be provided in most cases so your bundle is maximally portable.
   */
  bundledAdapter?: "wintercg-minimal"
}

export const bundle = async (options: BundleOptions) => {
  const routes = Object.entries(options.routeMap).map(([route, filePath]) => {
    return {
      route,
      filePath,
      id: getRandomId(16)
    }
  })

  const entrypoint = `
    import {getRouteMatcher} from "next-route-matcher"

    ${routes.map(({id, filePath}) => `import * as ${id} from "./${filePath}"`).join("\n")}

    const routeMapWithHandlers = {
      ${routes.map(({id, route}) => `"${route}": ${id}.default`).join(",")}
    }

    const edgeSpec = {
      routeMatcher: getRouteMatcher(Object.keys(routeMapWithHandlers)),
      routeMapWithHandlers
    }

    ${options.bundledAdapter === "wintercg-minimal" ? `
    import {addFetchListener} from "src2/adapters/wintercg-minimal.ts"
    addFetchListener(edgeSpec)
    ` : "export default edgeSpec"}
  `

  const result = await esbuild.build({
    stdin: {
      contents: entrypoint,
      resolveDir: options.directoryPath,
      loader: "ts",
    },
    bundle: true,
    format: "esm",
    write: false
  })

  return result.outputFiles![0].text
}
