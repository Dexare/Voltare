import VoltareClient from '../client/index.js';
import { LoggerExtra } from '../types.js';

/** A helper for modules to log events to Voltare */
export default class LoggerHandler<T extends VoltareClient<any>> {
  private readonly client: T;
  private readonly module: string;

  constructor(client: T, moduleName: string) {
    this.client = client;
    this.module = moduleName;
  }

  /**
   * Logs to Voltare on the `debug` level.
   * @param args The arguments to log
   */
  debug(...args: any[]) {
    return this.send('debug', args);
  }

  /**
   * Logs to Voltare on the `debug` level.
   * @param args The arguments to log
   */
  log(...args: any[]) {
    return this.send('debug', args);
  }

  /**
   * Logs to Voltare on the `info` level.
   * @param args The arguments to log
   */
  info(...args: any[]) {
    return this.send('info', args);
  }

  /**
   * Logs to Voltare on the `warn` level.
   * @param args The arguments to log
   */
  warn(...args: any[]) {
    return this.send('warn', args);
  }

  /**
   * Logs to Voltare on the `error` level.
   * @param args The arguments to log
   */
  error(...args: any[]) {
    return this.send('error', args);
  }

  /**
   * Logs to Voltare.
   * @param level The level to log to
   * @param args The arguments to log
   * @param extra The extra variables to log with
   */
  send(level: string, args: any[], extra?: LoggerExtra) {
    return this.client.emit('logger', level, this.module, args, extra);
  }
}
