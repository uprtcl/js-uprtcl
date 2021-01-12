export enum LogLevel {
  INFO = 0,
  LOG = 1,
  WARN = 2,
  ERROR = 3,
}

// TODO change node_env behaviour
function defaultLevel() {
  return LogLevel.INFO;
}

export class Logger {
  constructor(protected name: string, protected level: LogLevel = defaultLevel()) {}

  get prefix(): string {
    return `[${this.name}] `;
  }

  /**
   * Logs info if they are enabled
   */
  public info(...log: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(this.prefix, ...log);
    }
  }

  /**
   * Logs if they are enabled
   */
  public log(...log: any[]): void {
    if (this.level <= LogLevel.LOG) {
      console.log(this.prefix, ...log);
    }
  }

  /**
   * Logs warn if they are enabled
   */
  public warn(...log: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.prefix, ...log);
    }
  }

  /**
   * Logs error if they are enabled
   */
  public error(...log: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.prefix, ...log);
    }
  }
}
