type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createEntry(level: LogLevel, message: string, data?: any): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    // Add context in browser environment
    if (typeof window !== "undefined") {
      entry.url = window.location.href;
      entry.userAgent = navigator.userAgent;

      // Get user ID from local storage or session
      try {
        const authData = localStorage.getItem("auth-storage");
        if (authData) {
          const parsed = JSON.parse(authData);
          entry.userId = parsed?.user?.id;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    return entry;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const entry = this.createEntry(level, message, data);

    // Store in memory (limited)
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output in development
    if (process.env.NODE_ENV === "development") {
      const color = {
        debug: "\x1b[36m", // Cyan
        info: "\x1b[32m", // Green
        warn: "\x1b[33m", // Yellow
        error: "\x1b[31m", // Red
      }[level];

      console.log(
        `${color}[${level.toUpperCase()}]\x1b[0m ${entry.timestamp} - ${message}`,
        data || ""
      );
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === "production" && level === "error") {
      this.sendToMonitoringService(entry);
    }
  }

  private async sendToMonitoringService(entry: LogEntry): Promise<void> {
    try {
      // Send to your monitoring service (e.g., Sentry, LogRocket, etc.)
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // })
    } catch (error) {
      // Fail silently to avoid infinite loops
      console.error("Failed to send log to monitoring service:", error);
    }
  }

  debug(message: string, data?: any): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: any): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: any): void {
    this.log("warn", message, data);
  }

  error(message: string, data?: any): void {
    this.log("error", message, data);
  }

  // Get recent logs for debugging
  getRecentLogs(count = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();
