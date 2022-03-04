import type EventEmitter from 'events';

import VoltareClient from '../../client/index.js';

export default class VoltareEvent {
  public name: string;
  public event: string;
  public emitter: EventEmitter;
  public client: VoltareClient;
  public once: boolean;

  constructor(
    client: VoltareClient,
    options: { event: string; emitter?: EventEmitter; name?: string; once: boolean }
  ) {
    this.client = client;
    this.event = options.event;
    this.emitter = options.emitter ?? (client as EventEmitter);
    this.name = options.name ?? options.event;
    this.once = options.once;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public run(..._args: unknown[]): Awaited<unknown> {
    throw new Error('Run method not found.');
  }
}
