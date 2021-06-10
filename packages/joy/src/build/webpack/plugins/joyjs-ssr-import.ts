import { join, resolve, relative, dirname } from "path";
import { Compiler } from "webpack";

// This plugin modifies the require-ensure code generated by Webpack
// to work with Joy.js SSR
export default class JoyJsSsrImportPlugin {
  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap("JoyJsSSRImport", (compilation: any) => {
      compilation.mainTemplate.hooks.requireEnsure.tap(
        "JoyJsSSRImport",
        (code: string, chunk: any) => {
          // Update to load chunks from our custom chunks directory
          const outputPath = resolve("/");
          const pagePath = join("/", dirname(chunk.name));
          const relativePathToBaseDir = relative(pagePath, outputPath);
          // Make sure even in windows, the path looks like in unix
          // Node.js require system will convert it accordingly
          const relativePathToBaseDirNormalized = relativePathToBaseDir.replace(
            /\\/g,
            "/"
          );
          return code
            .replace(
              'require("./"',
              `require("${relativePathToBaseDirNormalized}/"`
            )
            .replace(
              "readFile(join(__dirname",
              `readFile(join(__dirname, "${relativePathToBaseDirNormalized}"`
            );
        }
      );
    });
  }
}