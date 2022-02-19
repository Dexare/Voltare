import path from 'path';
import { fileURLToPath } from 'node:url';
import VoltareClient from '../../../client/index.js';
import VoltareCommand from '../command.js';
import CommandContext from '../context.js';

export default class LoadCommand extends VoltareCommand {
  constructor(client: VoltareClient<any>) {
    super(client, {
      name: 'load',
      description: 'Loads modules.',
      category: 'Developer',
      userPermissions: ['voltare.elevated'],
      metadata: {
        examples: ['load ./path/to/module', 'load ~@dexare/logger'],
        usage: '<path> [path] ...',
        details: 'You can prefix a path name with `~` to load from a package.'
      }
    });

    this.filePath = fileURLToPath(import.meta.url);
  }

  async run(ctx: CommandContext) {
    if (!ctx.args.length) return 'Please define module(s) you want to load.';

    const mods: any[] = [];

    for (const arg of ctx.args) {
      try {
        let requirePath: string;
        if (arg.startsWith('~')) {
          requirePath = arg.slice(1);
        } else {
          requirePath = path.join(process.cwd(), arg);
        }
        delete require.cache[require.resolve(requirePath)];
        const mod = await import(requirePath);
        mods.push(mod);
      } catch (e) {
        if ((e as any).code === 'MODULE_NOT_FOUND') return `A module could not be found in \`${arg}\`.`;
        return `Error loading module from \`${arg}\`: \`${(e as any).toString()}\``;
      }
    }

    try {
      await this.client.loadModulesAsync(...mods);
      return `Loaded ${ctx.args.length.toLocaleString()} module(s).`;
    } catch (e) {
      return `Error loading modules: \`${(e as any).toString()}\``;
    }
  }
}
