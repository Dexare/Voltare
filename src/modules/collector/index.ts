import Collection from '@discordjs/collection';
import * as Revolt from 'better-revolt-js';
import VoltareClient from '../../client';
import VoltareModule from '../../module';
import Collector from './collector';
import MessageCollector, { MessageCollectorFilter, MessageCollectorOptions } from './message';

/** The options for {@link CollectorModule#awaitMessages}. */
export interface AwaitMessagesOptions extends MessageCollectorOptions {
  /** Stop/end reasons that cause the promise to reject */
  errors?: string[];
}

/** The Voltare module for collecting objects. */
export default class CollectorModule<T extends VoltareClient<any>> extends VoltareModule<T> {
  readonly activeCollectors = new Collection<string, Collector>();

  constructor(client: T) {
    super(client, {
      name: 'collector',
      description: "Voltare's collection handler, for asynchronous object collection."
    });

    this.filePath = __filename;
  }

  /**
   * Creates a message collector.
   * @param channel The channel to create the collector for
   * @param filter The filter to use against new messages
   * @param options The options for the collector.
   */
  createMessageCollector(
    channel: Revolt.TextChannel | Revolt.DMChannel | Revolt.GroupChannel,
    filter: MessageCollectorFilter,
    options: MessageCollectorOptions = {}
  ): MessageCollector {
    return new MessageCollector(this, channel, filter, options);
  }

  /** Awaits messages in a channel. */
  awaitMessages(
    channel: Revolt.TextChannel | Revolt.DMChannel | Revolt.GroupChannel,
    filter: MessageCollectorFilter,
    options: AwaitMessagesOptions = {}
  ) {
    return new Promise((resolve, reject) => {
      const collector = this.createMessageCollector(channel, filter, options);
      collector.once('end', (collection, reason) => {
        if (options.errors && options.errors.includes(reason)) {
          reject(collection);
        } else {
          resolve(collection);
        }
      });
    });
  }
}
