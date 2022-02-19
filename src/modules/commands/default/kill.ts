import { fileURLToPath } from 'node:url';
import VoltareClient from '../../../client/index.js';
import VoltareCommand from '../command.js';
import CommandContext from '../context.js';

export default class KillCommand extends VoltareCommand {
  constructor(client: VoltareClient<any>) {
    super(client, {
      name: 'kill',
      description: 'Disconnects the bot and kills the process.',
      category: 'Developer',
      userPermissions: ['voltare.elevated'],
      metadata: {
        examples: ['kill']
      }
    });

    this.filePath = fileURLToPath(import.meta.url);
  }

  async run(ctx: CommandContext) {
    await ctx.reply('Killing the bot...');
    await this.client.disconnect();
    process.exit(0);
  }
}
