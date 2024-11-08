export const LOGGING_LEVEL = [
  "FATAL",
  "ERROR",
  "WARN",
  "INFO",
  "DEBUG",
  "TRACE",
] as const;
export type LoggingLevelType = typeof LOGGING_LEVEL[number];

export function consoleLog(
  label: string,
  level: LoggingLevelType = "INFO",
  message: string =""
): void {
  const threshold = (process.env.LOGGING_LEVEL as LoggingLevelType) || "DEBUG";
  if (LOGGING_LEVEL.indexOf(level) <= LOGGING_LEVEL.indexOf(threshold)) {
    console.log(`[${label}] [${level}]: ${message}`);
  }
}
