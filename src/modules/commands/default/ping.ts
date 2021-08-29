import { oneLine } from 'common-tags';
import VoltareClient from '../../../client';
import VoltareCommand from '../command';
import CommandContext from '../context';

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

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    const timeBeforeMessage = Date.now();
    const pingMsg = await ctx.reply('Pinging...');
    await pingMsg.edit(oneLine`
      Pong! The message took ${(Date.now() - timeBeforeMessage).toLocaleString()}ms to be created.
    `);
  }
}
