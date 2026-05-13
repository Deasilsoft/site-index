import type { LogWriter } from "./types.js";

export const defaultLogWriter: LogWriter = {
  info(message): void {
    process.stdout.write(`${message}\n`);
  },
  warn(message): void {
    process.stderr.write(`${message}\n`);
  },
  error(message): void {
    process.stderr.write(`${message}\n`);
  },
};
