import { env } from "../config/env.js";

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  blue: "\x1b[36m",
  gray: "\x1b[90m",
};

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const getCurrentLogLevel = () => LOG_LEVELS[env.LOG_LEVEL] || LOG_LEVELS.info;

const formatLog = (level, message, data) => {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : "";
  return `[${timestamp}] ${level}:${dataStr ? " " + message + dataStr : " " + message}`;
};

export const logger = {
  debug: (message, data) => {
    if (getCurrentLogLevel() <= LOG_LEVELS.debug) {
      console.log(
        `${COLORS.gray}${formatLog("DEBUG", message, data)}${COLORS.reset}`,
      );
    }
  },

  info: (message, data) => {
    if (getCurrentLogLevel() <= LOG_LEVELS.info) {
      console.log(
        `${COLORS.blue}${formatLog("INFO", message, data)}${COLORS.reset}`,
      );
    }
  },

  warn: (message, data) => {
    if (getCurrentLogLevel() <= LOG_LEVELS.warn) {
      console.warn(
        `${COLORS.yellow}${formatLog("WARN", message, data)}${COLORS.reset}`,
      );
    }
  },

  error: (message, data) => {
    if (getCurrentLogLevel() <= LOG_LEVELS.error) {
      console.error(
        `${COLORS.red}${formatLog("ERROR", message, data)}${COLORS.reset}`,
      );
    }
  },
};
