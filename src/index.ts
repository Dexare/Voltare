import VoltareClient from './client';
import EventRegistry from './client/events';
import PermissionRegistry from './client/permissions';
import CollectorModule from './modules/collector';
import Collector from './modules/collector/collector';
import MessageCollector from './modules/collector/message';
import CommandsModule from './modules/commands';
import VoltareCommand from './modules/commands/command';
import CommandContext from './modules/commands/context';
import ArgumentInterpreter from './modules/commands/interpreter';
import VoltareModule from './module';
import LoggerHandler from './util/logger';
import DataManager from './dataManager';
import MemoryDataManager from './dataManagers/memory';
import * as Util from './util';
import * as fs from 'node:fs';

export {
  VoltareClient,
  EventRegistry,
  PermissionRegistry,
  CollectorModule,
  Collector,
  MessageCollector,
  CommandsModule,
  VoltareCommand,
  CommandContext,
  ArgumentInterpreter,
  VoltareModule,
  LoggerHandler,
  DataManager,
  MemoryDataManager,
  Util
};

export { VoltareEvents, BaseConfig } from './client/index.js';
export { EventHandlers, EventGroup, ClientEvent } from './client/events.js';
export { PermissionFunction, CorePermissions } from './client/permissions.js';
export { CollectorOptions, CollectorFilter, ResetTimerOptions } from './modules/collector/collector.js';
export { AwaitMessagesOptions } from './modules/collector/index.js';
export { MessageCollectorOptions, MessageCollectorFilter } from './modules/collector/message.js';
export { DefaultCommand } from './modules/commands/index.js';
export { CommandOptions, ThrottlingOptions } from './modules/commands/command.js';
export { StringIterator } from './modules/commands/interpreter.js';
export { ThrottleObject, ThrottleResult } from './dataManager.js';
export * from './constants.js';
export { ModuleOptions } from './module.js';
export { LoggerExtra, PermissionObject } from './types.js';

export const VERSION = JSON.parse(
  await fs.promises.readFile(new URL('../package.json', import.meta.url), { encoding: 'utf-8' })
).version;

export type { User } from 'revolt-api/types/Users';
export type { Channel } from 'revolt-api/types/Channels';
export type { Server, Member, MemberCompositeKey, Role } from 'revolt-api/types/Servers';
