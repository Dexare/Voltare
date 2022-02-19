import Collection from '@discordjs/collection';
import uniq from 'lodash.uniq';
import LoggerHandler from '../util/logger.js';
import { Arguments } from '../util/typedEmitter.js';
import VoltareClient, { VoltareEvents } from './index.js';

/** @hidden */
export type EventHandlers = {
  [event in keyof VoltareEvents]: (
    event: ClientEvent,
    ...args: Arguments<VoltareEvents[event]>
  ) => Promise<void> | void;
} & {
  [event: string]: (event: ClientEvent, ...args: any[]) => Promise<void> | void;
};

/** @hidden */
export type EventGroup = {
  [event in keyof EventHandlers]?: {
    group: string;
    before: string[];
    after: string[];
    listener: EventHandlers[event];
  };
} & {
  [event: string]: {
    group: string;
    before: string[];
    after: string[];
    listener: (event: ClientEvent, ...args: any[]) => Promise<void> | void;
  };
};

/** An object that temporarily stores the data of an event. */
export class ClientEvent {
  /** The groups that have been (or will be) skipped. */
  readonly skipped: string[] = [];
  /** The name of this event. */
  readonly name: keyof VoltareEvents;
  /** The data for this event. Can be altered at any time */
  readonly data = new Map<string, any>();

  constructor(name: keyof VoltareEvents) {
    this.name = name;
  }

  /**
   * Skip a group's listener for this event, if it has not already been fired.
   * @param group The group/extension/module name
   */
  skip(group: string) {
    if (!this.skipped.includes(group)) this.skipped.push(group);
  }

  /**
   * Whether a data key exists within the data.
   * @param key The key to check
   */
  has(key: string) {
    return this.data.has(key);
  }

  /**
   * Gets a key within the event's data.
   * @param key The key to get
   */
  get(key: string) {
    return this.data.get(key);
  }

  /**
   * Sets a key within the event's data.
   * @param key The key to set
   * @param value The data
   */
  set(key: string, data: any) {
    return this.data.set(key, data);
  }
}

/** The event registry that handles the event system. */
export default class EventRegistry<T extends VoltareClient<any>> {
  /** The event groups in the registry. */
  readonly eventGroups = new Collection<string, EventGroup>();
  /** the client responsible for this registry. */
  readonly client: T;

  private readonly loadOrders = new Map<keyof VoltareEvents, string[]>();
  private readonly hookedEvents: (keyof VoltareEvents)[] = [];
  private readonly logger: LoggerHandler<T>;

  constructor(client: T) {
    this.client = client;
    this.logger = new LoggerHandler<T>(this.client, 'voltare/events');
  }

  /**
   * Registers an event.
   * @param groupName The group to register with
   * @param event The event to register
   * @param listener The event listener
   * @param options The options for the event
   */
  register<E extends keyof VoltareEvents>(
    groupName: string,
    event: E,
    listener: EventHandlers[E],
    options?: { before?: string[]; after?: string[] }
  ) {
    this.logger.log(`Registering event '${event}' for group '${groupName}'`);
    const eventGroup = this.eventGroups.has(groupName) ? this.eventGroups.get(groupName)! : {};
    eventGroup[event] = {
      group: groupName,
      before: (options && options.before) || [],
      after: (options && options.after) || [],
      listener
    };
    this.eventGroups.set(groupName, eventGroup);
    this.hookEvent(event);
    this.refreshLoadOrder(event);
  }

  /**
   * Unregisters an event from a group.
   * @param groupName The group to unregister from
   * @param event The event to unregister
   */
  unregister(groupName: string, event: keyof VoltareEvents) {
    this.logger.log(`Unregistering event '${event}' from group '${groupName}'`);
    if (!this.eventGroups.has(groupName)) return;
    const eventGroup = this.eventGroups.get(groupName)!;
    delete eventGroup[event];
    this.eventGroups.set(groupName, eventGroup);
    this.refreshLoadOrder(event);
  }

  /**
   * Unregisters a group, removing all of their listeners.
   * @param groupName The group to unregister
   */
  unregisterGroup(groupName: string) {
    this.logger.log(`Unregistering event group '${groupName}'`);
    const refresh = this.eventGroups.has(groupName);
    const result = this.eventGroups.delete(groupName);
    if (refresh) this.refreshAllLoadOrders();
    return result;
  }

  /**
   * Emits an event.
   * @param event The event to emit
   * @param args The arcuments to emit with
   */
  emit<E extends keyof VoltareEvents>(event: E, ...args: Arguments<VoltareEvents[E]>) {
    if (!this.loadOrders.has(event)) this.refreshLoadOrder(event);
    const loadOrder = this.loadOrders.get(event)!;
    const clientEvent = new ClientEvent(event);

    // Do async emitting w/o returning promises
    (async () => {
      for (const groupName of loadOrder) {
        if (clientEvent.skipped.includes(groupName)) continue;
        try {
          await this.eventGroups.get(groupName)![event]!.listener(clientEvent, ...args);
        } catch (e) {}
      }
    })();
  }

  /**
   * Emits an event asynchronously.
   * @param event The event to emit
   * @param args The arcuments to emit with
   */
  async emitAsync<E extends keyof VoltareEvents>(event: E, ...args: Arguments<VoltareEvents[E]>) {
    if (!this.loadOrders.has(event)) this.refreshLoadOrder(event);
    const loadOrder = this.loadOrders.get(event)!;
    const clientEvent = new ClientEvent(event);

    for (const groupName of loadOrder) {
      if (clientEvent.skipped.includes(groupName)) continue;
      try {
        await this.eventGroups.get(groupName)![event]!.listener(clientEvent, ...args);
      } catch (e) {}
    }
  }

  private hookEvent(event: keyof VoltareEvents) {
    if (this.hookedEvents.includes(event)) return;
    this.hookedEvents.push(event);
    this.client.on(event, (...args: any) => this.emit(event, ...args));
  }

  private refreshLoadOrder(event: keyof VoltareEvents) {
    this.loadOrders.set(event, this.createLoadOrder(event));
  }

  private refreshAllLoadOrders() {
    const events = uniq(
      this.eventGroups.reduce(
        (prev, group) => (Object.keys(group) as (keyof VoltareEvents)[]).concat(prev),
        [] as (keyof VoltareEvents)[]
      )
    );
    events.forEach((event) => this.refreshLoadOrder(event));
  }

  private createLoadOrder<E extends keyof VoltareEvents>(event: E) {
    const handlers = Array.from(this.eventGroups.values())
      .filter((group) => event in group)
      .map((group) => group[event]);

    const loadOrder: string[] = [];

    function insert(handler: EventGroup[E]) {
      if (handler.before && handler.before.length)
        handler.before.forEach((groupName) => {
          const dep = handlers.find((handler) => handler.group === groupName);
          if (dep) insert(dep);
        });
      if (!loadOrder.includes(handler.group)) loadOrder.push(handler.group);
      if (handler.after && handler.after.length)
        handler.after.forEach((groupName) => {
          const dep = handlers.find((handler) => handler.group === groupName);
          if (dep) insert(dep);
        });
    }

    // handle "afters" first
    handlers.filter((group) => group.after.length).forEach((handler) => insert(handler));

    // handle "befores" second
    handlers.filter((group) => group.before.length).forEach((handler) => insert(handler));

    // handle others last
    handlers
      .filter((group) => !group.before.length && !group.after.length)
      .forEach((handler) => insert(handler));

    return loadOrder;
  }
}
