import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import log from "electron-log";
import { GraphAILogger } from "graphai";

const LOG_DIR = path.join(app.getPath("userData"), "mulmocastLog"); 
const RETENTION_DAYS = 7;
const MAX_SIZE = 10 * 1024 * 1024;

function pad(n: number) { return String(n).padStart(2, "0"); }
function ymd(d = new Date()) {
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${y}-${m}-${day}`;
}

function dailyLogPath(date = new Date()) {
  return path.join(LOG_DIR, `app-${ymd(date)}.log`);
}

function ensureDir() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function cleanupOldLogs() {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const re = /^app-(\d{4}-\d{2}-\d{2})\.log(\.old)?$/;

  for (const name of fs.readdirSync(LOG_DIR)) {
    const m = name.match(re);
    if (!m) continue;
    const fileDate = new Date(m[1] + "T00:00:00");
    if (fileDate.getTime() < cutoff) {
      try { fs.rmSync(path.join(LOG_DIR, name), { force: true }); } catch {}
    }
  }
}

export function setupLogger() {
  ensureDir();

  log.transports.file.resolvePathFn = () => dailyLogPath();

  log.transports.file.maxSize = MAX_SIZE;
  log.transports.file.archiveLog = (filename) => `${filename}.old`;

  log.transports.file.level = process.env.NODE_ENV === "production" ? "info" : "debug";
  log.transports.console.level = process.env.NODE_ENV === "production" ? false : "debug";

  cleanupOldLogs();

  process.on("uncaughtException", (err) => {
    log.error("uncaughtException", err);
  });
  process.on("unhandledRejection", (reason) => {
    log.error("unhandledRejection", reason as any);
  });

  log.info("Logger initialized", {
    logDir: LOG_DIR,
    todayFile: dailyLogPath(),
    retentionDays: RETENTION_DAYS,
    maxSize: MAX_SIZE,
    nodeEnv: process.env.NODE_ENV,
  });

  const consoleAndFileLogger = (level: string, ...args: any[]) => {
    const consoleMethod = (log as any)[level] || log.log;
    consoleMethod(...args);
  };
  GraphAILogger.setLogger(consoleAndFileLogger);
  return log;
}
