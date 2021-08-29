import * as Revolt from 'better-revolt-js';
import CommandsModule from '.';
import VoltareClient from '../../client';
import { ClientEvent } from '../../client/events';

export default class CommandContext {
  /** The commands module. */
  readonly cmdsModule: CommandsModule<VoltareClient<any>>;
  /** The event that created this context. */
  readonly event: ClientEvent;
  /** The client from this context. */
  readonly client: VoltareClient<any>;
  /** The message this context is reffering to. */
  readonly message: Revolt.Message;
  /** The channel that the message is in. */
  readonly channel: Revolt.TextChannel | Revolt.DMChannel | Revolt.GroupChannel;
  /** The author of the message. */
  readonly author: Revolt.User;
  /** The prefix used for this context. */
  readonly prefix: string;
  /** The arguments used in this context. */
  readonly args: string[];
  /** The server the message is in. */
  readonly server?: Revolt.Server;
  /** The member that created the message. */
  member?: Revolt.ServerMember;

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
    message: Revolt.Message
  ) {
    this.cmdsModule = cmdsModule;
    this.client = cmdsModule.client;
    this.event = event;
    this.message = message;
    this.channel = message.channel;
    this.author = message.author!;
    if (message.member) this.member = message.member;
    if ('server' in message && message.server) this.server = message.server;
    this.args = args;
    this.prefix = prefix;
  }

  /*
    TODO attachments, send through .send() and .reply()

    https://autumn.revolt.chat/attachments
    Form Data to `file`
    {"id":"IdRF3_PV0-AD7kCyuQ-Vd98ZhGrvjiUYQM0WcIrP-d"}

    In message:
    { attachments: ['IdRF3_PV0-AD7kCyuQ-Vd98ZhGrvjiUYQM0WcIrP-d'] }
  */

  /** Shorthand for `message.channel.send`. */
  send(content: Revolt.MessageOptions | string) {
    return this.message.channel.send(content);
  }

  /**
   * Replies to the message in context.
   */
  reply(content: Revolt.MessageOptions | string) {
    if (typeof content === 'string') content = { content };
    if ('replies' in content && content.replies) content.replies.push({ id: this.message.id, mention: true });
    else content.replies = [{ id: this.message.id, mention: true }];
    return this.message.channel.send(content);
  }

  /**
   * Fetches the member for this message and assigns it.
   */
  async fetchMember() {
    if (this.member) return this.member;
    if (!this.server) return null;
    let member = this.server.members.cache.get(this.author.id);
    if (member) {
      this.member = member;
      return member;
    }
    member = await this.server.members.fetch(this.author.id);
    this.member = member;
    return member;
  }
}
