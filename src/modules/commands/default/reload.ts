import fs from 'fs';
import { fileURLToPath } from 'node:url';
import VoltareClient from '../../../client/index.js';
import VoltareCommand from '../command.js';
import CommandContext from '../context.js';

export default class ReloadCommand extends VoltareCommand {
  constructor(client: VoltareClient<any>) {
    super(client, {
      name: 'reload',
      description: 'Reloads modules.',
      category: 'Developer',
      userPermissions: ['voltare.elevated'],
      metadata: {
        examples: ['reload moduleName'],
        usage: '<moduleName> [moduleName] ...'
      }
    });

    this.filePath = fileURLToPath(import.meta.url);
  }

  fileExists(path: string) {
    const stat = fs.lstatSync(path);
    return stat.isFile();
  }

  async run(ctx: CommandContext) {
    if (!ctx.args.length) return 'Please define module(s) you want to reload.';

    for (const arg of ctx.args) {
      if (!this.client.modules.has(arg)) return `The module \`${arg}\` does not exist.`;
      const mod = this.client.modules.get(arg)!;
      if (!mod.filePath) return `The module \`${arg}\` does not have a file path defined.`;
      if (!this.fileExists(mod.filePath)) return `The file for module \`${arg}\` no longer exists.`;
      await this.client.unloadModule(arg);
      delete require.cache[require.resolve(mod.filePath)];
      const newMod = await import(mod.filePath);
      this.client.loadModules(newMod);
    }

    return `Reloaded ${ctx.args.length.toLocaleString()} module(s).`;
  }
}
