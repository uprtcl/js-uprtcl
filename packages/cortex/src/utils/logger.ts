export enum LogLevel {
  INFO = 0,
  LOG = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  constructor(protected name: string, protected level: LogLevel = process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.INFO) {}

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
