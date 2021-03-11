// @flow
import { ConcatSource } from "webpack-sources";
import {
  IS_BUNDLED_PAGE_REGEX,
  ROUTE_NAME_REGEX,
} from "../../../lib/constants";

export default class PagesPlugin {
  apply(compiler: any) {
    compiler.hooks.compilation.tap("PagesPlugin", (compilation: any) => {
      compilation.chunkTemplate.hooks.render.tap(
        "PagesPluginRenderPageRegister",
        (modules: any, chunk: any) => {
          if (!IS_BUNDLED_PAGE_REGEX.test(chunk.name)) {
            return modules;
          }
          const matched = ROUTE_NAME_REGEX.exec(chunk.name);
          let routeName = (matched && matched[1]) || "";

          // We need to convert \ into / when we are in windows
          // to get the proper route name
          // Here we need to do windows check because it's possible
          // to have "\" in the filename in unix.
          // Anyway if someone did that, he'll be having issues here.
          // But that's something we cannot avoid.
          if (/^win/.test(process.platform)) {
            routeName = routeName.replace(/\\/g, "/");
          }

          routeName = `/${routeName.replace(/(^|\/)index$/, "")}`;

          const source = new ConcatSource();

          source.add(`__JOY_REGISTER_PAGE('${routeName}', function() {
            var comp =
        `);
          source.add(modules);
          source.add(`
            return { page: comp.default }
          })
        `);

          return source;
        }
      );
    });
  }
}
