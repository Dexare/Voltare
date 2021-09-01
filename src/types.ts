import VoltareCommand from './modules/commands/command';
import { User } from 'revolt.js/dist/maps/Users';
import { Member } from 'revolt.js/dist/maps/Members';
import { Message } from 'revolt.js/dist/maps/Messages';

/** @hidden */
interface LoggerExtraBase {
  [key: string]: any;
}

/** Extra data for logger events. */
export interface LoggerExtra extends LoggerExtraBase {
  command?: VoltareCommand;
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
