import { RuntimeException } from "./runtime.exception";

export class UnknownElementException extends RuntimeException {
  constructor(name?: string) {
    super(
      `Joy could not find ${
        name || "given"
      } element (this provider does not exist in the current context)`
    );
  }
}
