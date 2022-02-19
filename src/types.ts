import VoltareCommand from './modules/commands/command.js';
import { User } from 'revolt.js/dist/maps/Users';
import { Member } from 'revolt.js/dist/maps/Members';
import { Message } from 'revolt.js/dist/maps/Messages';
import { Channel } from 'revolt-api/types/Channels';
import {
  RemoveChannelField,
  RemoveMemberField,
  RemoveServerField,
  RemoveUserField
} from 'revolt.js/dist/api/routes';
import { MemberCompositeKey, Role, Server, Member as MemberI } from 'revolt-api/types/Servers';
import { User as UserI, RelationshipStatus } from 'revolt-api/types/Users';

/** @hidden */
interface LoggerExtraBase {
  [key: string]: any;
}

/** Extra data for logger events. */
export interface LoggerExtra extends LoggerExtraBase {
  command?: VoltareCommand;
}

export interface ChannelUpdatePacket {
  type: 'ChannelUpdate';
  id: string;
  data: Partial<Channel>;
  clear?: RemoveChannelField | undefined;
}

export interface ServerUpdatePacket {
  type: 'ServerUpdate';
  id: string;
  data: Partial<Server>;
  clear?: RemoveServerField | undefined;
}

export interface ServerMemberUpdatePacket {
  type: 'ServerMemberUpdate';
  id: MemberCompositeKey;
  data: Partial<MemberI>;
  clear?: RemoveMemberField | undefined;
}

export interface ServerRoleUpdatePacket {
  type: 'ServerRoleUpdate';
  id: string;
  role_id: string;
  data: Partial<Role>;
}

export interface UserUpdatePacket {
  type: 'UserUpdate';
  id: string;
  data: Partial<UserI>;
  clear?: RemoveUserField | undefined;
}

export interface UserRelationshipUpdate {
  type: 'UserRelationship';
  user: UserI;
  status: RelationshipStatus;
}

/** The object for checking permissions. */
export interface PermissionObject {
  user: User;
  member?: Member;
  message?: Message;
}

/** The types of images in Autumn. */
export type AutumnType = 'avatars' | 'attachments' | 'icons' | 'banners';

/** An image uplodable to Autumn. */
export interface AutumnUploadable {
  name: string;
  file: Buffer;
}
