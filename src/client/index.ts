import Collection from '@discordjs/collection';
import * as Revolt from 'better-revolt-js';
import { LoginDetails } from 'better-revolt-js/dist/client/Client';
import { ClientOptions } from 'better-revolt-js/dist/client/BaseClient';
import EventEmitter from 'eventemitter3';
import { RevoltEventNames } from '../constants';
import VoltareModule from '../module';
import CommandsModule from '../modules/commands';
import CollectorModule from '../modules/collector';
import { RevoltEvents, LoggerExtra } from '../types';
import LoggerHandler from '../util/logger';
import TypedEmitter from '../util/typedEmitter';
import EventRegistry from './events';
import PermissionRegistry from './permissions';
import DataManager from '../dataManager';
import MemoryDataManager from '../dataManagers/memory';

type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> };

export interface BaseConfig {
  login: LoginDetails;
  revoltOptions?: DeepPartial<ClientOptions>;
  elevated?: string | Array<string>;
}

/**
 * The events typings for the {@link VoltareClient}.
 * @private
 */
export interface VoltareClientEvents extends RevoltEvents {
  logger(level: string, group: string, args: any[], extra?: LoggerExtra): void;
  beforeConnect(): void;
  afterConnect(): void;
  beforeDisconnect(): void;
  afterDisconnect(): void;
}

/** @hidden */
export type VoltareEvents = VoltareClientEvents & {
  [event: string]: (...args: any[]) => void;
};

export default class VoltareClient<
  T extends BaseConfig = BaseConfig
> extends (EventEmitter as any as new () => TypedEmitter<VoltareEvents>) {
  config: T;
  readonly bot: Revolt.Client;
  readonly permissions: PermissionRegistry<this>;
  readonly events = new EventRegistry<this>(this);
  readonly logger = new LoggerHandler<this>(this, 'voltare/client');
  readonly modules = new Collection<string, VoltareModule<this>>();
  readonly commands = new CommandsModule<this>(this);
  readonly collector = new CollectorModule<this>(this);
  data: DataManager = new MemoryDataManager(this);
  private readonly _hookedEvents: string[] = [];
  private _revoltEventsLogged = false;

  constructor(config: T, bot?: Revolt.Client) {
    // eslint-disable-next-line constructor-super
    super();

    this.config = config;
    if (bot) this.bot = bot;
    else this.bot = new Revolt.Client(this.config.revoltOptions);
    this.permissions = new PermissionRegistry(this);
    this.modules.set('commands', this.commands);
    this.commands._load();
    this.modules.set('collector', this.collector);
    this.collector._load();
  }

  /**
   * Load modules into the client.
   * @param moduleObjects The modules to load.
   * @returns The client for chaining purposes
   */
  loadModules(...moduleObjects: any[]) {
    const modules = moduleObjects.map(this._resolveModule.bind(this));
    const loadOrder = this._getLoadOrder(modules);

    for (const modName of loadOrder) {
      const mod = modules.find((mod) => mod.options.name === modName)!;
      if (this.modules.has(mod.options.name))
        throw new Error(`A module in the client already has been named "${mod.options.name}".`);
      this._log('debug', `Loading module "${modName}"`);
      this.modules.set(modName, mod);
      mod._load();
    }

    return this;
  }

  /**
   * Load modules into the client asynchronously.
   * @param moduleObjects The modules to load.
   * @returns The client for chaining purposes
   */
  async loadModulesAsync(...moduleObjects: any[]) {
    const modules = moduleObjects.map(this._resolveModule.bind(this));
    const loadOrder = this._getLoadOrder(modules);

    for (const modName of loadOrder) {
      const mod = modules.find((mod) => mod.options.name === modName)!;
      if (this.modules.has(mod.options.name))
        throw new Error(`A module in the client already has been named "${mod.options.name}".`);
      this._log('debug', `Loading module "${modName}"`);
      this.modules.set(modName, mod);
      await mod._load();
    }
  }

  /**
   * Loads a module asynchronously into the client.
   * @param moduleObject The module to load
   */
  async loadModule(moduleObject: any) {
    const mod = this._resolveModule(moduleObject);
    if (this.modules.has(mod.options.name))
      throw new Error(`A module in the client already has been named "${mod.options.name}".`);
    this._log('debug', `Loading module "${mod.options.name}"`);
    this.modules.set(mod.options.name, mod);
    await mod._load();
  }

  /**
   * Unloads a module.
   * @param moduleName The module to unload
   */
  async unloadModule(moduleName: string) {
    if (!this.modules.has(moduleName)) return;
    const mod = this.modules.get(moduleName)!;
    this._log('debug', `Unloading module "${moduleName}"`);
    await mod.unload();
    this.modules.delete(moduleName);
  }

  /**
   * Loads a data manager asynchronously into the client.
   * @param moduleObject The manager to load
   * @param startOnLoad Whether to start the manager after loading
   */
  async loadDataManager(mgrObject: any, startOnLoad = false) {
    if (typeof mgrObject === 'function') mgrObject = new mgrObject(this);
    else if (typeof mgrObject.default === 'function') mgrObject = new mgrObject.default(this);

    if (!(mgrObject instanceof DataManager))
      throw new Error(`Invalid data manager object to load: ${mgrObject}`);

    await this.data.stop();
    this.data = mgrObject;
    if (startOnLoad) await this.data.start();
  }

  /**
   * Log events to console.
   * @param logLevel The level to log at.
   * @param excludeModules The modules to exclude
   */
  logToConsole(logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info', excludeModules: string[] = []) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const index = levels.indexOf(logLevel);
    this.on('logger', (level, moduleName, args) => {
      let importance = levels.indexOf(level);
      if (importance === -1) importance = 0;
      if (importance < index) return;

      if (excludeModules.includes(moduleName)) return;

      let logFunc = console.debug;
      if (level === 'info') logFunc = console.info;
      else if (level === 'error') logFunc = console.error;
      else if (level === 'warn') logFunc = console.warn;
      logFunc(level.toUpperCase(), `[${moduleName}]`, ...args);
    });

    return this;
  }

  /** Logs informational Revolt events to Voltare's logger event. */
  logErisEvents() {
    if (this._revoltEventsLogged) return this;
    this._revoltEventsLogged = true;

    this.on('raw', (data: any) => {
      if (data.type === 'Authenticated') this.emit('logger', 'debug', 'revolt', ['Authenticated']);
    });
    this.on('ready', () => this.emit('logger', 'info', 'revolt', ['Bot is ready.']));
    this.on('debug', (message) => this.emit('logger', 'debug', 'revolt', [message]));
    this.on('error', (error) => this.emit('logger', 'error', 'revolt', [error]));

    return this;
  }

  /**
   * Register an event.
   * @param event The event to register
   * @param listener The event listener
   */
  on<E extends keyof VoltareEvents>(event: E, listener: VoltareEvents[E]) {
    if (
      typeof event === 'string' &&
      !this._hookedEvents.includes(event) &&
      RevoltEventNames.includes(event)
    ) {
      // @ts-ignore
      this.bot.on(event, (...args: any[]) => this.emit(event, ...args));
      this._hookedEvents.push(event);
    }

    return super.on(event, listener);
  }

  /**
   * Creates a promise that resolves on the next event
   * @param event The event to wait for
   */
  waitTill(event: keyof VoltareEvents) {
    return new Promise((resolve) => this.once(event, resolve));
  }

  /** Connects and logs in to Revolt. */
  async connect() {
    await this.events.emitAsync('beforeConnect');
    await this.data.start();
    await this.bot.login(this.config.login);
    await this.events.emitAsync('afterConnect');
  }

  /** Disconnects the bot. */
  async disconnect() {
    await this.events.emitAsync('beforeDisconnect');
    await this.data.stop();
    await this.bot.logout();
    await this.events.emitAsync('afterDisconnect');
  }

  /** @hidden */
  private _resolveModule(moduleObject: any) {
    if (typeof moduleObject === 'function') moduleObject = new moduleObject(this);
    else if (typeof moduleObject.default === 'function') moduleObject = new moduleObject.default(this);

    if (!(moduleObject instanceof VoltareModule))
      throw new Error(`Invalid module object to load: ${moduleObject}`);
    return moduleObject;
  }

  /** @hidden */
  private _getLoadOrder(modules: VoltareModule<any>[]) {
    const loadOrder: string[] = [];

    const insert = (mod: VoltareModule<any>) => {
      if (mod.options.requires && mod.options.requires.length)
        mod.options.requires.forEach((modName) => {
          const dep = modules.find((mod) => mod.options.name === modName) || this.modules.get(modName);
          if (!dep)
            throw new Error(
              `Module '${mod.options.name}' requires dependency '${modName}' which does not exist!`
            );
          if (!this.modules.has(modName)) insert(dep);
        });
      if (!loadOrder.includes(mod.options.name)) loadOrder.push(mod.options.name);
    };

    modules.forEach((mod) => insert(mod));

    return loadOrder;
  }

  private _log(level: string, ...args: any[]) {
    this.emit('logger', level, 'voltare', args);
  }
}
