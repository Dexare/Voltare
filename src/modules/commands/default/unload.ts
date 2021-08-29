import VoltareClient from '../../../client';
import VoltareCommand from '../command';
import CommandContext from '../context';

export default class UnloadCommand extends VoltareCommand {
  constructor(client: VoltareClient<any>) {
    super(client, {
      name: 'unload',
      description: 'Unloads modules.',
      category: 'Developer',
      userPermissions: ['voltare.elevated'],
      metadata: {
        examples: ['unload moduleName'],
        usage: '<moduleName> [moduleName] ...'
      }
    });

    this.filePath = __filename;
  }

  async run(ctx: CommandContext) {
    if (!ctx.args.length) return 'Please define module(s) you want to unload.';

    for (const arg of ctx.args) {
      if (!this.client.modules.has(arg)) return `The module \`${arg}\` does not exist.`;
      await this.client.unloadModule(arg);
    }

    return `Unloaded ${ctx.args.length.toLocaleString()} module(s).`;
  }
}
