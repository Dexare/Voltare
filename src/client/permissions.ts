import Collection from '@discordjs/collection';
import { ChannelPermission, ServerPermission, UserPermission } from 'revolt.js/dist/api/permissions';
import { Member } from 'revolt.js/dist/maps/Members';
import { Message } from 'revolt.js/dist/maps/Messages';
import { User } from 'revolt.js/dist/maps/Users';
import { PermissionObject } from '../types';
import LoggerHandler from '../util/logger';
import { ClientEvent } from './events';
import VoltareClient from './index';

// TODO rewrite this

/** The function for a permission. */
export type PermissionFunction<T extends VoltareClient<any>> = (
  object: PermissionObject,
  client: T,
  event?: ClientEvent
) => boolean;

export const CorePermissions = [
  ...Object.keys(UserPermission).map((permission) => 'revolt.user.' + permission.toLowerCase()),
  ...Object.keys(ChannelPermission).map((permission) => 'revolt.channel.' + permission.toLowerCase()),
  ...Object.keys(ServerPermission).map((permission) => 'revolt.server.' + permission.toLowerCase()),
  'voltare.elevated',
  'voltare.inserver'
];

/** The registry for permissions in Voltare. */
export default class PermissionRegistry<T extends VoltareClient<any>> {
  readonly permissions = new Collection<string, PermissionFunction<T>>();
  private readonly logger: LoggerHandler<T>;
  private readonly client: T;

  constructor(client: T) {
    this.client = client;
    this.logger = new LoggerHandler<T>(this.client, 'voltare/permissions');

    // TODO revolt permissions
    // for (const permission in Revolt.ChannelPermissions.FLAGS) {
    //   this.permissions.set('revolt.channel.' + permission.toLowerCase(), (object) => {
    //     if (object.message)
    //       if (object.message.serverId && object.member) {}
    //     else if (object.member) {}
    //     return Revolt.DEFAULT_PERMISSION_DM.has(permission as ChannelPermissionsResolvable);
    //   });
    // }

    this.permissions.set('voltare.elevated', (object, client) => {
      if (!client.config.elevated) return false;

      if (Array.isArray(client.config.elevated)) return client.config.elevated.includes(object.user._id);
      return client.config.elevated === object.user._id;
    });

    this.permissions.set('voltare.inserver', (object) => {
      if (object.member) return true;
      if (object.message) return !!object.message.channel?.server_id;
      return false;
    });
  }

  /**
   * Registers a new permission.
   * @param key The permission key to register
   * @param permission The permission function to use
   */
  register(key: string, permission: PermissionFunction<T>): void {
    key = key.toLowerCase();
    if (CorePermissions.includes(key)) throw new Error(`Cannot register to core permissions. (${key})`);
    this.logger.log(`Registering permission '${key}'`);

    this.permissions.set(key, permission);
  }

  /**
   * Unregisters a permission.
   * @param key The permission to unregister
   */
  unregister(key: string): boolean {
    key = key.toLowerCase();
    if (CorePermissions.includes(key)) throw new Error(`Cannot unregister core permissions. (${key})`);
    this.logger.log(`Unregistering permission '${key}'`);

    return this.permissions.delete(key);
  }

  /**
   * Check a permission.
   * @param object The object to check with
   * @param permission The permission to check
   * @param event The client event to associate the function
   */
  has(object: PermissionObject, permission: string, event?: ClientEvent) {
    permission = permission.toLowerCase();
    if (!permission || !this.permissions.has(permission)) return false;
    return this.permissions.get(permission)!(object, this.client, event);
  }

  /**
   * Maps permissions into an object with true/false values and permission keys.
   * @param object The object to check with
   * @param permissions The permissions to map
   * @param prevMap The previous map, if any
   * @param event The client event to associate
   */
  map(
    object: PermissionObject,
    permissions: string[],
    prevMap: { [permission: string]: boolean } = {},
    event?: ClientEvent
  ) {
    for (const permission of permissions) {
      if (permission in prevMap) continue;
      prevMap[permission] = this.has(object, permission, event);
    }

    return prevMap;
  }

  /**
   * Convert something into a permission object.
   * @param object The object to convert
   */
  toObject(object: Message | User | Member): PermissionObject {
    const result: any = {};

    let user: User;
    if (object instanceof Message) user = object.author!;
    else if (object instanceof Member) user = this.client.bot.users.get(object._id.user)!;
    else user = object;

    result.user = user;
    if (object instanceof Member) result.member = object;
    if (object instanceof Message) {
      result.message = object;
      if (object.member) result.member = object.member;
    }

    return result;
  }
}
