import { Channel } from 'revolt.js/dist/maps/Channels';
import { Message } from 'revolt.js/dist/maps/Messages';
import CollectorModule from '.';
import { VoltareClient } from '../..';
import { ClientEvent } from '../../client/events';
import Collector, { CollectorOptions } from './collector';

export type MessageCollectorFilter = (message: Message) => boolean;

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
  readonly channel: Channel;
  readonly options!: MessageCollectorOptions;
  received = 0;
  constructor(
    collectorModule: CollectorModule<VoltareClient<any>>,
    channel: Channel,
    filter: MessageCollectorFilter,
    options: MessageCollectorOptions = {}
  ) {
    super(collectorModule, filter, options);
    this.channel = channel;

    this.registerEvent('message', this.handleCollect, {
      before: this.options.skip || []
    });
    this.registerEvent('messageDelete', this.handleDispose);
    this.registerEvent('channelDelete', (_, channelId) => {
      if (channel._id === channelId) this.stop('channelDelete');
    });
    this.registerEvent('serverDelete', (_, serverId) => {
      if (this.channel.server_id === serverId) this.stop('serverDelete');
    });
  }

  /**
   * Handles a message for possible collection.
   * @param message The message that could be collected
   */
  collect(event: ClientEvent, message: Message) {
    if (!message.channel) return null;
    if (message.channel._id !== this.channel._id) return null;
    if (this.options.skip) this.options.skip.forEach((group) => event.skip(group));
    this.received++;
    return {
      key: message._id,
      value: message
    };
  }

  /**
   * Handles a message for possible disposal.
   * @param messageId The ID of the message that could be disposed of
   */
  dispose(_: never, messageId: string) {
    return this.collected.has(messageId);
  }

  /** Checks after un/collection to see if the collector is done. */
  endReason() {
    if (this.options.max && this.collected.size >= this.options.max) return 'limit';
    if (this.options.maxProcessed && this.received === this.options.maxProcessed) return 'processedLimit';
    return null;
  }
}
