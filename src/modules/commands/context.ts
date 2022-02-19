import { Route } from 'revolt.js/dist/api/routes';
import { Channel } from 'revolt.js/dist/maps/Channels';
import { Member } from 'revolt.js/dist/maps/Members';
import { Message } from 'revolt.js/dist/maps/Messages';
import { Server } from 'revolt.js/dist/maps/Servers';
import { User } from 'revolt.js/dist/maps/Users';
import CommandsModule from './index.js';
import VoltareClient from '../../client/index.js';
import { ClientEvent } from '../../client/events.js';

export type MessageOptions =
  | string
  | (Omit<Route<'POST', '/channels/id/messages'>['data'], 'nonce'> & { nonce?: string });

export default class CommandContext {
  /** The commands module. */
  readonly cmdsModule: CommandsModule<VoltareClient<any>>;
  /** The event that created this context. */
  readonly event: ClientEvent;
  /** The client from this context. */
  readonly client: VoltareClient<any>;
  /** The message this context is reffering to. */
  readonly message: Message;
  /** The channel that the message is in. */
  readonly channel: Channel;
  /** The author of the message. */
  readonly author: User;
  /** The prefix used for this context. */
  readonly prefix: string;
  /** The arguments used in this context. */
  readonly args: string[];
  /** The server the message is in. */
  readonly server?: Server;
  /** The member that created the message. */
  member?: Member;

  /**
   * @param creator The instantiating creator.
   * @param data The interaction data for the context.
   * @param respond The response function for the interaction.
   * @param webserverMode Whether the interaction was from a webserver.
   */
  constructor(
    cmdsModule: CommandsModule<any>,
    event: ClientEvent,
    args: string[],
    prefix: string,
    message: Message
  ) {
    this.cmdsModule = cmdsModule;
    this.client = cmdsModule.client;
    this.event = event;
    this.message = message;
    this.channel = message.channel!;
    this.author = message.author!;
    if (message.member) this.member = message.member;
    if (message.channel!.server) this.server = message.channel!.server;
    this.args = args;
    this.prefix = prefix;
  }

  /** Shorthand for `channel.sendMessage`. */
  send(content: MessageOptions) {
    return this.channel.sendMessage(content);
  }

  /**
   * Replies to the message in context.
   */
  reply(content: MessageOptions | string, mention = true) {
    if (typeof content === 'string') content = { content };
    if ('replies' in content && content.replies) content.replies.push({ id: this.message._id, mention });
    else content.replies = [{ id: this.message._id, mention }];
    return this.channel.sendMessage(content);
  }
}
