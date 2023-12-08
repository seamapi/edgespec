var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/next-route-matcher/dist/index.js
var require_dist = __commonJS({
  "node_modules/next-route-matcher/dist/index.js"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export(src_exports, {
      default: () => src_default,
      getRouteMatcher: () => getRouteMatcher2,
      getRouteMatcherUgly: () => getRouteMatcherUgly
    });
    module.exports = __toCommonJS(src_exports);
    function escapeRegex(str) {
      return str.replace(/[|\\{}()[\]^$+*?.-]/g, "\\$&");
    }
    function parseParameter(param) {
      const optional = param.startsWith("[") && param.endsWith("]");
      if (optional) {
        param = param.slice(1, -1);
      }
      const repeat = param.startsWith("...");
      if (repeat) {
        param = param.slice(3);
      }
      return { key: param, repeat, optional };
    }
    function getParametrizedRoute(route) {
      const segments = (route.replace(/\/$/, "") || "/").slice(1).split("/");
      const groups = {};
      let groupIndex = 1;
      const parameterizedRoute = segments.map((segment) => {
        if (segment.startsWith("[") && segment.endsWith("]")) {
          const { key, optional, repeat } = parseParameter(segment.slice(1, -1));
          groups[key] = { pos: groupIndex++, repeat, optional };
          return repeat ? optional ? "(?:/(.+?))?" : "/(.+?)" : "/([^/]+?)";
        } else {
          return `/${escapeRegex(segment)}`;
        }
      }).join("");
      if (typeof window === "undefined") {
        let routeKeyCharCode = 97;
        let routeKeyCharLength = 1;
        const getSafeRouteKey = () => {
          let routeKey = "";
          for (let i = 0; i < routeKeyCharLength; i++) {
            routeKey += String.fromCharCode(routeKeyCharCode);
            routeKeyCharCode++;
            if (routeKeyCharCode > 122) {
              routeKeyCharLength++;
              routeKeyCharCode = 97;
            }
          }
          return routeKey;
        };
        const routeKeys = {};
        let namedParameterizedRoute = segments.map((segment) => {
          if (segment.startsWith("[") && segment.endsWith("]")) {
            const { key, optional, repeat } = parseParameter(segment.slice(1, -1));
            let cleanedKey = key.replace(/\W/g, "");
            let invalidKey = false;
            if (cleanedKey.length === 0 || cleanedKey.length > 30) {
              invalidKey = true;
            }
            if (!isNaN(parseInt(cleanedKey.substr(0, 1)))) {
              invalidKey = true;
            }
            if (invalidKey) {
              cleanedKey = getSafeRouteKey();
            }
            routeKeys[cleanedKey] = key;
            return repeat ? optional ? `(?:/(?<${cleanedKey}>.+?))?` : `/(?<${cleanedKey}>.+?)` : `/(?<${cleanedKey}>[^/]+?)`;
          } else {
            return `/${escapeRegex(segment)}`;
          }
        }).join("");
        return {
          parameterizedRoute,
          namedParameterizedRoute,
          groups,
          routeKeys
        };
      }
      return {
        parameterizedRoute,
        groups
      };
    }
    function getRouteRegex(normalizedRoute) {
      const result = getParametrizedRoute(normalizedRoute);
      if ("routeKeys" in result) {
        return {
          re: new RegExp(`^${result.parameterizedRoute}(?:/)?$`),
          groups: result.groups,
          routeKeys: result.routeKeys,
          namedRegex: `^${result.namedParameterizedRoute}(?:/)?$`
        };
      }
      return {
        re: new RegExp(`^${result.parameterizedRoute}(?:/)?$`),
        groups: result.groups
      };
    }
    function getRouteMatcherFunc(routeRegex) {
      const { re, groups } = routeRegex;
      return (pathname) => {
        const routeMatch = re.exec(pathname);
        if (!routeMatch) {
          return false;
        }
        const decode = (param) => {
          try {
            return decodeURIComponent(param);
          } catch (_) {
            throw new Error("failed to decode param");
          }
        };
        const params = {};
        Object.keys(groups).forEach((slugName) => {
          const g = groups[slugName];
          const m = routeMatch[g.pos];
          if (m !== void 0) {
            params[slugName] = ~m.indexOf("/") ? m.split("/").map((entry) => decode(entry)) : g.repeat ? [decode(m)] : decode(m);
          }
        });
        return params;
      };
    }
    var getRouteMatcherUgly = (routeMapping) => {
      const routes = [];
      for (const [fsPath, serverFunc] of Object.entries(routeMapping)) {
        const routeRegex = getRouteRegex(fsPath);
        routes.push({
          fsPath,
          routeRegex,
          matcherFunc: getRouteMatcherFunc(routeRegex),
          serverFunc,
          priority: -Object.keys(routeRegex.groups).length
        });
      }
      routes.sort((a, b) => b.priority - a.priority);
      return (incomingPath) => {
        for (const { serverFunc, matcherFunc, fsPath } of routes) {
          const match = matcherFunc(incomingPath);
          if (match) {
            return { serverFunc, match, fsPath };
          }
        }
        return null;
      };
    };
    var getRouteMatcher2 = (routes) => {
      const routeMapping = {};
      for (const route of routes)
        routeMapping[route] = () => {
        };
      const uglyMatcher = getRouteMatcherUgly(routeMapping);
      return (incomingPath) => {
        const result = uglyMatcher(incomingPath);
        if (!result)
          return null;
        return { matchedRoute: result.fsPath, routeParams: result.match };
      };
    };
    var src_default = getRouteMatcher2;
  }
});

// <stdin>
var import_next_route_matcher = __toESM(require_dist());

// tests2/adapters/api/health.ts
var health = async (request) => {
  return Response.json({
    ok: true
  });
};
var health_default = health;

// <stdin>
var routeMapWithHandlers = {
  "/health": health_default
};
var edgeSpec = {
  routeMatcher: (0, import_next_route_matcher.getRouteMatcher)(Object.keys(routeMapWithHandlers)),
  routeMapWithHandlers
};
var stdin_default = edgeSpec;
export {
  stdin_default as default
};
