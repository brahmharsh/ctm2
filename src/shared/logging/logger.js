// Shared logger utility (can be swapped for pino/winston later)
export const logger = {
  info(msg, meta = {}) {
    console.log(`[INFO] ${msg}`, meta);
  },
  warn(msg, meta = {}) {
    console.warn(`[WARN] ${msg}`, meta);
  },
  error(msg, meta = {}) {
    console.error(`[ERROR] ${msg}`, meta);
  },
  debug(msg, meta = {}) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[DEBUG] ${msg}`, meta);
    }
  },
};
