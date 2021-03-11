// @flow
import { RawSource } from "webpack-sources";
import { PAGES_MANIFEST, ROUTE_NAME_REGEX } from "../../../lib/constants";
import * as webpack from "webpack";

// This plugin creates a pages-manifest.json from page entrypoints.
// This is used for mapping paths like `/` to `.joy/server/static/<buildid>/pages/index.js` when doing SSR
// It's also used by joy export to provide defaultPathMap
export default class PagesManifestPlugin {
  apply(compiler: webpack.Compiler) {
    compiler.hooks.emit.tapAsync(
      "JoyPagesManifest",
      (compilation, callback) => {
        const { entries } = compilation;
        const pages = {};

        for (const entry of entries) {
          const result = ROUTE_NAME_REGEX.exec(entry.name);
          if (!result) {
            continue;
          }

          const pagePath = result[1];

          if (!pagePath) {
            continue;
          }

          const { name } = entry;
          // @ts-ignore
          pages[`/${pagePath.replace(/\\/g, "/")}`] = name;
        }
        // @ts-ignore
        if (typeof pages["/index"] !== "undefined") {
          // @ts-ignore
          pages["/"] = pages["/index"];
        }

        compilation.assets[PAGES_MANIFEST] = new RawSource(
          JSON.stringify(pages)
        );
        callback();
      }
    );
  }
}
