import { fileURLToPath } from 'node:url';
import VoltareClient from '../client/index.js';
import DataManager, { ThrottleObject } from '../dataManager.js';

/** Data manager in Voltare using memory. */
export default class MemoryDataManager extends DataManager {
  static SEPARATOR = '|';
  /** Current throttle objects for commands, mapped by scope and ID. */
  private _throttles = new Map<string, ThrottleObject>();

  constructor(client: VoltareClient<any>) {
    super(client, {
      name: 'memory-data',
      description: 'Voltare data manager using memory.'
    });

    this.filePath = fileURLToPath(import.meta.url);
  }

  async getThrottle(scope: string, id: string) {
    return this._throttles.get([scope, id].join(MemoryDataManager.SEPARATOR));
  }

  async setThrottle(scope: string, id: string, object: ThrottleObject) {
    this._throttles.set([scope, id].join(MemoryDataManager.SEPARATOR), object);
    return;
  }

  async removeThrottle(scope: string, id: string) {
    this._throttles.delete([scope, id].join(MemoryDataManager.SEPARATOR));
    return;
  }

  /**
   * Flushes any expired throttles.
   */
  flushThrottles() {
    for (const key in this._throttles) {
      const throttle = this._throttles.get(key);
      if (throttle && throttle.reset < Date.now()) this._throttles.delete(key);
    }
  }
}
