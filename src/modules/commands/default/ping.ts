import { fileURLToPath } from 'node:url';
import VoltareClient from '../../../client/index.js';
import VoltareCommand from '../command.js';
import CommandContext from '../context.js';

export default class PingCommand extends VoltareCommand {
  constructor(client: VoltareClient<any>) {
    super(client, {
      name: 'ping',
      description: "Checks the bot's ping and latency.",
      category: 'General',
      metadata: {
        examples: ['ping']
      }
    });

    this.filePath = fileURLToPath(import.meta.url);
  }

  async run(ctx: CommandContext) {
    const timeBeforeMessage = Date.now();
    const pingMsg = await ctx.reply('Pinging...');
    await pingMsg.edit({
      content: `Pong! The message took ${(Date.now() - timeBeforeMessage).toLocaleString()}ms to be created.`
    });
  }
}
