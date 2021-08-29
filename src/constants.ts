import { Events } from 'better-revolt-js';

export const RevoltEventNames: string[] = [
  Events.MESSAGE,
  Events.MESSAGE_DELETE,
  Events.MESSAGE_UPDATE,

  Events.SERVER_CREATE,
  Events.SERVER_DELETE,
  Events.SERVER_UPDATE,

  Events.READY,
  Events.DEBUG,
  Events.ERROR,
  Events.RAW,

  Events.USER_UPDATE,

  Events.CHANNEL_CREATE,
  Events.CHANNEL_DELETE,
  Events.CHANNEL_UPDATE,

  Events.SERVER_MEMBER_JOIN,
  Events.SERVER_MEMBER_LEAVE,
  Events.SERVER_MEMBER_UPDATE,

  Events.ROLE_CREATE,
  Events.ROLE_DELETE,
  // Events.ROLE_UPDATE,
  Events.TYPING_START,
  Events.TYPING_STOP,
  Events.GROUP_JOIN,
  Events.GROUP_LEAVE
];

export const PermissionNames: { [perm: string]: string } = {
  'voltare.inserver': 'Ran in a Server',
  'voltare.elevated': 'Bot developer'
};
