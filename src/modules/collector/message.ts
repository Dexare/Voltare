import * as Revolt from 'better-revolt-js';
import CollectorModule from '.';
import { VoltareClient } from '../..';
import { ClientEvent } from '../../client/events';
import Collector, { CollectorOptions } from './collector';

export type MessageCollectorFilter = (message: Revolt.Message) => boolean;

export interface MessageCollectorOptions extends CollectorOptions {
  /** The maximum amount of messages to collect */
  max?: number;
  /** The maximum amount of messages to process */
  maxProcessed?: number;
  /** The event groups to skip over while collecting */
  skip?: string[];
}

/**
 * Collects messages on a channel.
 * Will automatically stop if the channel (`'channelDelete'`) or guild (`'guildDelete'`) are deleted.
 */
export default class MessageCollector extends Collector {
  readonly channel: Revolt.TextChannel | Revolt.DMChannel | Revolt.GroupChannel;
  readonly options!: MessageCollectorOptions;
  received = 0;
  constructor(
    collectorModule: CollectorModule<VoltareClient<any>>,
    channel: Revolt.TextChannel | Revolt.DMChannel | Revolt.GroupChannel,
    filter: MessageCollectorFilter,
    options: MessageCollectorOptions = {}
  ) {
    super(collectorModule, filter, options);
    this.channel = channel;

    this.registerEvent(Revolt.Events.MESSAGE, this.handleCollect, {
      before: this.options.skip || []
    });
    this.registerEvent(Revolt.Events.MESSAGE_DELETE, this.handleDispose);
    this.registerEvent(Revolt.Events.CHANNEL_DELETE, (_, channel) => {
      if (channel.id === this.channel.id) this.stop('channelDelete');
    });
    this.registerEvent(Revolt.Events.SERVER_DELETE, (_, server) => {
      if ('serverId' in this.channel && server.id === this.channel.serverId) this.stop('serverDelete');
    });
  }

  /**
   * Handles a message for possible collection.
   * @param message The message that could be collected
   */
  collect(event: ClientEvent, message: Revolt.Message) {
    if (message.channel.id !== this.channel.id) return null;
    if (this.options.skip) this.options.skip.forEach((group) => event.skip(group));
    this.received++;
    return {
      key: message.id,
      value: message
    };
  }

  /**
   * Handles a message for possible disposal.
   * @param message The message that could be disposed of
   */
  dispose(_: never, message: Revolt.Message) {
    return message.channel.id === this.channel.id ? message.id : null;
  }

  /** Checks after un/collection to see if the collector is done. */
  endReason() {
    if (this.options.max && this.collected.size >= this.options.max) return 'limit';
    if (this.options.maxProcessed && this.received === this.options.maxProcessed) return 'processedLimit';
    return null;
  }
}
