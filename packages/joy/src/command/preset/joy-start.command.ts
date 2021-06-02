import { CommandProvider } from "../command-provider.decorator";
// import yargs = require('yargs');
// import yargs from "yargs";
import { JoyCommand, JoyCommandOptionType } from "../command";
import { printAndExit } from "../../server/lib/utils";
import { Configuration, CoreContext, Inject } from "@symph/core";
import http from "http";
import { JoyAppConfig } from "../../joy-server/server/joy-config/joy-app-config";
import { JoyServer } from "../../joy-server/server/joy-server";
import { ServerConfig } from "../../joy-server/server/server-config";
import { ReactContextFactory } from "../../joy-server/server/react-context-factory";
import { Protocol } from "playwright-chromium/types/protocol";
import { JoyGenModuleServerProvider } from "../../plugin/joy-gen-module-server.provider";
import { ReactRouterServer } from "../../router/react-router-server";
import { getServerAutoGenerateModules } from "../../plugin/getServerGenModules";
import { JoyReactRouterPluginDev } from "../../router/joy-react-router-plugin-dev";

@Configuration()
class JoyPluginsConfig {
  @Configuration.Provider({ type: ReactRouterServer })
  public reactRouter: ReactRouterServer;
}

@Configuration()
export class JoyServerConfig {
  @Configuration.Provider()
  public serverConfig: ServerConfig;

  @Configuration.Provider()
  public reactContextFactory: ReactContextFactory;

  @Configuration.Provider()
  public joyServer: JoyServer;
}

@CommandProvider()
export class JoyStartCommand extends JoyCommand {
  private dir: string;

  constructor(
    private joyAppConfig: JoyAppConfig,
    @Inject() private appContext: CoreContext
  ) {
    super();
  }

  getName(): string {
    return "start";
  }

  options() {
    return {
      port: { alias: "p", type: "number" as const, default: 3000 },
      hostname: { type: "string" as const, default: "localhost" },
    };
  }

  async startServer(appContext: CoreContext): Promise<JoyServer> {
    const distDir = this.joyAppConfig.resolveAppDir(this.joyAppConfig.distDir);
    await appContext.loadModule([
      ...getServerAutoGenerateModules(distDir),
      JoyPluginsConfig,
      JoyServerConfig,
    ]);
    const config = this.joyAppConfig;
    const { dir, hostname, port } = config;
    const server = await appContext.get(JoyServer);

    const srv = http.createServer(server.getRequestHandler());
    await new Promise<void>((resolve, reject) => {
      // This code catches EADDRINUSE error if the port is already in use
      srv.on("error", reject);
      srv.on("listening", () => resolve());
      srv.listen(port, hostname);
    }).catch((err) => {
      if (err.code === "EADDRINUSE") {
        let errorMessage = `Port ${port} is already in use.`;
        const pkgAppPath = require("find-up").sync("package.json", {
          cwd: dir,
        });
        const appPackage = require(pkgAppPath);
        if (appPackage.scripts) {
          const joyScript = Object.entries(appPackage.scripts).find(
            (scriptLine) => scriptLine[1] === "joy"
          );
          if (joyScript) {
            errorMessage += `\nUse \`npm run ${joyScript[0]} -- -p <some other port>\`.`;
          }
        }
        throw new Error(errorMessage);
      } else {
        throw err;
      }
    });

    // todo 重新设计，当应用关闭时，也要关闭http模块，否则jest测试item无法结束。
    // @ts-ignore
    server.closeSrv = async () => {
      await server.close();
      return new Promise<void>((resolve, reject) => {
        srv.close((err) => {
          err ? reject(err) : resolve();
        });
      });
    };

    return server;
  }

  async run(args: JoyCommandOptionType<this>): Promise<any> {
    // @ts-ignore
    process.env.NODE_ENV = "production";

    const dir = args._[0] || ".";
    const { port, hostname } = args;
    const appUrl = `http://${hostname}:${port}`;
    this.joyAppConfig.mergeCustomConfig({ dir, hostname, port, dev: false });
    try {
      const server = await this.startServer(this.appContext);
      await server.prepare();
      console.log(
        `started server on http://${args["--hostname"] || "localhost"}:${port}`
      );
    } catch (err) {
      console.error(err);
      printAndExit(undefined, 1);
    }
  }
}
