import VoltareClient, { VoltareEvents } from './client/index.js';
import { EventHandlers } from './client/events.js';
import LoggerHandler from './util/logger.js';

/** Options for the {@link VoltareModule}. */
export interface ModuleOptions {
  /** The name of the module. */
  name: string;
  /** The requirements/dependencies of the module. */
  requires?: string[];
  /** The description of the module. */
  description?: string;
}

/** A module for Voltare. */
export default class VoltareModule<T extends VoltareClient<any>> {
  /** The options for this module. */
  readonly options: ModuleOptions;
  /** @hidden */
  readonly registerQueue: [
    { event: keyof VoltareEvents; before?: string[]; after?: string[] },
    EventHandlers[keyof VoltareEvents]
  ][] = [];
  /** The logger for the module. */
  readonly logger: LoggerHandler<T>;
  /** The Voltare client for this module. */
  readonly client: T;
  /** Whether the module has been loaded. */
  loaded = false;
  /**
   * The file path of the module.
   * Set this to `__filename` in the constructor.
   */
  filePath?: string;

  constructor(client: T, options: ModuleOptions) {
    this.options = options;
    this.client = client;
    this.logger = new LoggerHandler<T>(this.client, this.options.name);
  }

  /** @hidden */
  async _load() {
    this.loaded = true;
    this.registerQueue.forEach(([{ event, before, after }, handler]) =>
      this.registerEvent(event, handler, { before, after })
    );
    this.registerQueue.length = 0;
    await this.load();
  }

  /** Fired when this module is loaded. */
  load() {}

  /** Fired when this module is being unloaded. */
  unload() {}

  /**
   * Registers an event for this module.
   * @param event The event to register
   * @param handler The event handler
   * @param options The options for the handler
   */
  registerEvent<E extends keyof VoltareEvents>(
    event: E,
    handler: EventHandlers[E],
    options?: { before?: string[]; after?: string[] }
  ) {
    return this.client.events.register(this.options.name, event, handler, options);
  }

  /**
   * Unregisters an event from this module.
   * @param event The event to unregister
   */
  unregisterEvent(event: keyof VoltareEvents) {
    return this.client.events.unregister(this.options.name, event);
  }

  /** Unregisters all events from this module. */
  unregisterAllEvents() {
    return this.client.events.unregisterGroup(this.options.name);
  }
}
