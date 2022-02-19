import Collection from '@discordjs/collection';
import * as Revolt from 'revolt.js';
import EventEmitter from 'eventemitter3';
import fetch from 'node-fetch';
import VoltareModule from '../module.js';
import CommandsModule from '../modules/commands/index.js';
import CollectorModule from '../modules/collector/index.js';
import {
  LoggerExtra,
  AutumnType,
  AutumnUploadable,
  ChannelUpdatePacket,
  ServerUpdatePacket,
  ServerMemberUpdatePacket,
  ServerRoleUpdatePacket,
  UserUpdatePacket,
  UserRelationshipUpdate
} from '../types.js';
import LoggerHandler from '../util/logger.js';
import TypedEmitter from '../util/typedEmitter.js';
import EventRegistry from './events.js';
import PermissionRegistry from './permissions.js';
import DataManager from '../dataManager.js';
import MemoryDataManager from '../dataManagers/memory.js';
import { MultipartData } from '../util/multipartData.js';
import { ClientboundNotification } from 'revolt.js/dist/websocket/notifications';
import { Message } from 'revolt.js/dist/maps/Messages';
import clone from 'lodash.clone';
import { Channel } from 'revolt-api/types/Channels';

export type LoginDetails =
  | {
      type: 'bot';
      token: string;
    }
  | {
      type: 'user';
      email: string;
      password: string;
    }
  | {
      type: 'session';
      user_id: string;
      session_token: string;
    };

export interface BaseConfig {
  login: LoginDetails;
  autumnHost?: string;
  revoltOptions?: Partial<Revolt.ClientOptions>;
  elevated?: string | Array<string>;
  allowMalformedSpam?: boolean;
}

/**
 * The events typings for the {@link VoltareClient}.
 * @private
 */
export interface VoltareClientEvents {
  logger(level: string, group: string, args: any[], extra?: LoggerExtra): void;
  beforeConnect(): void;
  afterConnect(): void;
  beforeDisconnect(): void;
  afterDisconnect(): void;

  error(error: any): void;
  ready(): void;
  connecting(): void;
  connected(): void;
  disconnected(): void;
  packet(packet: ClientboundNotification): void;

  message(message: Message): void;
  messageUpdate(message: Message): void;
  messageDelete(messageId: string): void;

  channelCreate(channel: Channel): void;
  channelUpdate(packet: ChannelUpdatePacket): void;
  channelDelete(channelId: string): void;

  groupUserJoin(serverId: string, userId: string): void;
  groupUserLeave(serverId: string, userId: string): void;

  serverUpdate(packet: ServerUpdatePacket): void;
  serverDelete(serverId: string): void;

  serverMemberJoin(serverId: string, user: string): void;
  serverMemberUpdate(packet: ServerMemberUpdatePacket): void;
  serverMemberLeave(serverId: string, user: string): void;

  serverRoleUpdate(packet: ServerRoleUpdatePacket): void;
  serverRoleDelete(serverId: string, roleId: string): void;

  userUpdate(packet: UserUpdatePacket): void;
  userRelationshipUpdate(packet: UserRelationshipUpdate): void;

  typingStart(channelId: string, userId: string): void;
  typingStop(channelId: string, userId: string): void;
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
  private _revoltEventsLogged = false;

  constructor(config: T, bot?: Revolt.Client) {
    // eslint-disable-next-line constructor-super
    super();

    this.config = clone(config);
    this.config.autumnHost ||= 'https://autumn.revolt.chat';
    if (bot) this.bot = bot;
    else this.bot = new Revolt.Client(this.config.revoltOptions);

    // Hook Revolt events, some are missing so it uses packets beforehand
    this.bot.on('ready', () => this.emit('ready'));
    this.bot.on('connected', () => this.emit('connected'));
    this.bot.on('connecting', () => this.emit('connecting'));
    this.bot.on('dropped', () => this.emit('disconnected'));
    this.bot.on('message', (message) => this.emit('message', message));
    this.bot.on('message/update', (message) => this.emit('messageUpdate', message));
    this.bot.on('message/delete', (messageId) => this.emit('messageDelete', messageId));
    this.bot.on('packet', (packet) => {
      this.emit('packet', packet);
      switch (packet.type) {
        case 'Error':
          // @ts-expect-error this isn't even in the union type wtf
          if (packet.error === 'MalformedData' && !this.config.allowMalformedSpam) return;
          // @ts-expect-error this actually exists, but types suck.
          return this.emit('error', `${packet.error}${packet.msg ? `: ${packet.msg}` : ''}`);
        case 'ChannelCreate':
          return this.emit('channelCreate', packet);
        case 'ChannelUpdate':
          return this.emit('channelUpdate', packet);
        case 'ChannelDelete':
          return this.emit('channelDelete', packet.id);
        case 'ChannelGroupJoin':
          return this.emit('groupUserJoin', packet.id, packet.user);
        case 'ChannelGroupLeave':
          return this.emit('groupUserLeave', packet.id, packet.user);
        case 'ServerUpdate':
          return this.emit('serverUpdate', packet);
        case 'ServerDelete':
          return this.emit('serverDelete', packet.id);
        case 'ServerMemberJoin':
          return this.emit('serverMemberJoin', packet.id, packet.user);
        case 'ServerMemberUpdate':
          return this.emit('serverMemberUpdate', packet);
        case 'ServerMemberLeave':
          return this.emit('serverMemberLeave', packet.id, packet.user);
        case 'ServerRoleUpdate':
          return this.emit('serverRoleUpdate', packet);
        case 'ServerRoleDelete':
          return this.emit('serverRoleDelete', packet.id, packet.role_id);
        case 'UserUpdate':
          return this.emit('userUpdate', packet);
        case 'UserRelationship':
          return this.emit('userRelationshipUpdate', packet);
        case 'ChannelStartTyping':
          return this.emit('typingStart', packet.id, packet.user);
        case 'ChannelStopTyping':
          return this.emit('typingStop', packet.id, packet.user);
      }
    });

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
  logRevoltEvents() {
    if (this._revoltEventsLogged) return this;
    this._revoltEventsLogged = true;

    this.on('connecting', () => this.emit('logger', 'debug', 'revolt', ['Connecting...']));
    this.on('connected', () => this.emit('logger', 'debug', 'revolt', ['Bot has connected.']));
    this.on('ready', () => this.emit('logger', 'info', 'revolt', ['Bot is ready.']));
    this.on('disconnected', () => this.emit('logger', 'info', 'revolt', ['Bot has disconnected.']));
    // this.on('debug', (message) => this.emit('logger', 'debug', 'revolt', [message]));
    this.on('error', (error) => this.emit('logger', 'error', 'revolt', [error]));

    return this;
  }

  /** Uploads something to Autumn and returns the ID. */
  async upload(file: AutumnUploadable, type: AutumnType = 'attachments') {
    const data = new MultipartData();
    data.attach('file', file.file, file.name);
    const response = await fetch(`${this.config.autumnHost!}/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=' + data.boundary },
      body: Buffer.concat(data.finish())
    });
    const body = await response.json();
    return (body as any).id as string;
  }

  /** Gets the URL of an image on Autumn. */
  imageToURL(id: string, type: AutumnType = 'attachments', size?: number) {
    return `${this.config.autumnHost!}/${type}/${id}${size ? `?max_side=${size}` : ''}`;
  }

  /**
   * Creates a promise that resolves on the next event
   * @param event The event to wait for
   */
  waitTill(event: keyof VoltareEvents) {
    return new Promise((resolve) => this.once(event, resolve));
  }

  /** Logs in to Revolt. */
  login(login: LoginDetails) {
    switch (login.type) {
      case 'bot':
        return this.bot.loginBot(login.token);
      case 'user':
        return this.bot.login({ email: login.email, password: login.password });
      case 'session':
        return this.bot.useExistingSession({
          name: 'Voltare',
          token: login.session_token,
          user_id: login.user_id
        });
    }
  }

  /** Logs out of Revolt. */
  async logout() {
    // @ts-expect-error we tappin into axios
    const isBot = !!this.bot.Axios.defaults.headers['x-bot-token'];
    isBot ? this.bot.reset() : await this.bot.logout();
  }

  /** Connects and logs in to Revolt. */
  async connect() {
    await this.events.emitAsync('beforeConnect');
    await this.data.start();
    await this.login(this.config.login);
    await this.events.emitAsync('afterConnect');
  }

  /** Disconnects the bot. */
  async disconnect() {
    await this.events.emitAsync('beforeDisconnect');
    await this.data.stop();
    await this.logout();
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
