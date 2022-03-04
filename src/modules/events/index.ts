import { fileURLToPath, pathToFileURL } from 'url';
import Collection from '@discordjs/collection';

import { iterateFolder } from '../../util/index.js';
import VoltareClient from '../../client/index.js';
import VoltareModule from '../../module.js';
import VoltareEvent from './event.js';

export class EventsModule<T extends VoltareClient<any>> extends VoltareModule<T> {
  public events = new Collection<string, VoltareEvent>();

  constructor(client: T) {
    super(client, {
      name: 'Events',
      description: "Voltare's events handler."
    });

    this.filePath = fileURLToPath(import.meta.url);
  }

  /**
   * Registers a event.
   * @param event The command to register
   */
  public register(event: any) {
    if (Object.keys(event).length > 1) {
      return this.registerMultipleCommands(Object.values(event));
    }

    if (typeof event === 'function') event = new event(this.client);
    else if (typeof event.default === 'function') event = new event.default(this.client);

    if (!(event instanceof VoltareEvent)) {
      throw new Error(
        `The ${event} event could not be registered because its instance is not of type VoltareEvent.`
      );
    }

    if (this.events.some((e) => e.name === event.name)) {
      throw new Error(`There is already an event registered with the name ${event.name}.`);
    }

    event.emitter[event.once ? 'once' : 'on'](event.event, event.run);
    this.events.set(event.name, event);
    this.logger.info(`The event ${event.name} has been registered.`);

    return event;
  }

  /**
   * Registers commands from a folder.
   * @param path The path to register from.
   */
  public async registerFromFolder(path: string) {
    return iterateFolder(path, async (file) => {
      this.register(await import(pathToFileURL(file).href));
    });
  }

  /**
   * Unregisters a event.
   * @param event The event to unregister
   */
  public unregister(event: VoltareEvent) {
    event.emitter.off(event.name, event.run);
    this.events.delete(event.name);
    this.logger.log(`Unregistered event ${event.name}.`);
  }

  /**
   * Registers multiple commands from one file.
   * @param events The commands to register
   */
  private registerMultipleEvents(events: any) {
    for (const command of events) this.register(command);
  }
}
