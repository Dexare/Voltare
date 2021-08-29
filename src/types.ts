import VoltareCommand from './modules/commands/command';
import * as Revolt from 'better-revolt-js';
import { TextBasedChannel } from 'better-revolt-js/dist/structures/interfaces/TextBasedChannel';

/** @hidden */
export interface RevoltEvents {
  [Revolt.Events.MESSAGE]: (message: Revolt.Message) => void;
  [Revolt.Events.MESSAGE_DELETE]: (message: Revolt.Message) => void;
  [Revolt.Events.MESSAGE_UPDATE]: (oldMessage: Revolt.Message, newMessage: Revolt.Message) => void;

  [Revolt.Events.SERVER_CREATE]: (server: Revolt.Server) => void;
  [Revolt.Events.SERVER_DELETE]: (server: Revolt.Server) => void;
  [Revolt.Events.SERVER_UPDATE]: (oldServer: Revolt.Server, newServer: Revolt.Server) => void;

  [Revolt.Events.READY]: (client: Revolt.Client) => void;
  [Revolt.Events.DEBUG]: (message: string) => void;
  [Revolt.Events.ERROR]: (error: unknown) => void;
  [Revolt.Events.RAW]: (packet: unknown) => void;

  [Revolt.Events.USER_UPDATE]: (oldUser: Revolt.User, newUser: Revolt.User) => void;

  [Revolt.Events.CHANNEL_CREATE]: (channel: Revolt.Channel) => void;
  [Revolt.Events.CHANNEL_DELETE]: (channel: Revolt.Channel) => void;
  [Revolt.Events.CHANNEL_UPDATE]: (oldChannel: Revolt.Channel, newChannel: Revolt.Channel) => void;

  [Revolt.Events.SERVER_MEMBER_JOIN]: (member: Revolt.ServerMember) => void;
  [Revolt.Events.SERVER_MEMBER_LEAVE]: (member: Revolt.ServerMember) => void;
  [Revolt.Events.SERVER_MEMBER_UPDATE]: (
    oldMember: Revolt.ServerMember,
    newMember: Revolt.ServerMember
  ) => void;

  [Revolt.Events.ROLE_CREATE]: (role: Revolt.Role) => void; // not impl
  [Revolt.Events.ROLE_DELETE]: (role: Revolt.Role) => void;
  // [Revolt.Events.ROLE_UPDATE]: (oldRole: Revolt.Role, newRole: Revolt.Role) => void;

  [Revolt.Events.TYPING_START]: (channel: TextBasedChannel, user: Revolt.User) => void;
  [Revolt.Events.TYPING_STOP]: (channel: TextBasedChannel, user: Revolt.User) => void;

  [Revolt.Events.GROUP_JOIN]: (group: Revolt.GroupChannel, user: Revolt.User) => void;
  [Revolt.Events.GROUP_LEAVE]: (group: Revolt.GroupChannel, user: Revolt.User) => void;
}

/** @hidden */
interface LoggerExtraBase {
  [key: string]: any;
}

/** Extra data for logger events. */
export interface LoggerExtra extends LoggerExtraBase {
  command?: VoltareCommand;
  id?: number;
  trace?: string[];
}

/** The object for checking permissions. */
export interface PermissionObject {
  user: Revolt.User;
  member?: Revolt.ServerMember;
  message?: Revolt.Message;
}
