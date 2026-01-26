import { env } from "../config/env.ts";

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  blue: "\x1b[36m",
  gray: "\x1b[90m",
  magenta: "\x1b[35m",
} as const;

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const getCurrentLogLevel = (): number =>
  LOG_LEVELS[env.LOG_LEVEL as LogLevel] ?? LOG_LEVELS.info;

const formatLog = (
  level: LogLevel,
  message: string,
  data?: unknown,
): string => {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : "";
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${dataStr}`;
};

const formatStack = (stack?: string): string => (stack ? `\n${stack}` : "");

const log =
  (level: LogLevel, color: string, consoleFn: (...args: unknown[]) => void) =>
  (message: string, data?: unknown, stack?: string): void => {
    if (getCurrentLogLevel() <= LOG_LEVELS[level]) {
      const stackTrace = formatStack(stack);
      consoleFn(
        `${color}${formatLog(level, message, data)}${stackTrace}${COLORS.reset}`,
      );
    }
  };

export const logger = {
  debug: log("debug", COLORS.gray, console.log),
  info: log("info", COLORS.blue, console.log),
  warn: log("warn", COLORS.yellow, console.warn),
  error: log("error", COLORS.red, console.error),
  fatal: log("fatal", `${COLORS.red}${COLORS.magenta}`, console.error),
};
