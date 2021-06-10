import chalk from "chalk";
import { JoyBoot } from "../joy-boot";
import { PresetJoyCore } from "../preset-joy-core";
import { ServerFactory } from "@symph/server";

export const startTask = (async () => {
  let closed = false;

  function onSignal(signal: string) {
    if (closed) return;
    closed = true;

    // TODO 退出时触发插件中的onExit事件
    // example: joyBoot.onExitHook(signal)

    process.exit(0);
  }

  // kill(2) Ctrl-C
  process.once("SIGINT", () => onSignal("SIGINT"));
  // kill(3) Ctrl-\
  process.once("SIGQUIT", () => onSignal("SIGQUIT"));
  // kill(15) default
  process.once("SIGTERM", () => onSignal("SIGTERM"));

  let joyBoot: JoyBoot | undefined;
  try {
    let command = (process.argv.length >= 2 && process.argv[2]) || "help";
    if (!command || command.startsWith("-")) {
      command = "help";
    }

    // joyBoot = new JoyBoot(PresetJoyCore);
    joyBoot = await ServerFactory.createServer(
      PresetJoyCore,
      undefined,
      undefined,
      JoyBoot
    );
    await joyBoot.init();
    await joyBoot.runCommand(command);
  } catch (e) {
    console.error(chalk.red(e.message));
    console.error(e.stack);
    process.exit(1);
  }
})();