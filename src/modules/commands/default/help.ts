import { oneLine, stripIndents } from 'common-tags';
import { fileURLToPath } from 'node:url';
import VoltareClient from '../../../client/index.js';
import { keyValueForEach, splitMessage, truncate } from '../../../util/index.js';
import VoltareCommand from '../command.js';
import CommandContext from '../context.js';

export default class HelpCommand extends VoltareCommand {
  constructor(client: VoltareClient<any>) {
    super(client, {
      name: 'help',
      description: 'Displays a list of available commands, or detailed information for a specified command.',
      category: 'General',
      metadata: {
        examples: ['help', 'help ping'],
        usage: '[command]',
        details: oneLine`
          The command may be part of a command name or a whole command name.
          If it isn't specified, all available commands will be listed.
        `
      }
    });

    this.filePath = fileURLToPath(import.meta.url);
  }

  async run(ctx: CommandContext) {
    const prefix = ctx.prefix + (ctx.event.get('commands/spacedPrefix') ? ' ' : '');

    if (ctx.args.length) {
      const commands = ctx.cmdsModule.find(ctx.args[0], ctx);
      if (!commands.length) return `I couldn't find any commands with \`${ctx.args[0]}\`!`;
      else {
        const command = commands[0];
        let text = stripIndents`
          __**${prefix}${command.name}**:__ ${command.description || ''}
					**Category:** ${command.category}
        `;

        // Aliases
        if (command.aliases.length !== 0) {
          text += `\n**Aliases:** ${command.aliases.join(', ')}`;
        }

        // Details
        if (command.metadata?.details) {
          text += `\n**Details:** ${command.metadata.details}`;
        }

        // Usage
        if (command.metadata?.usage) {
          text += `\n**Usage:** ${command.metadata.usage}`;
        }

        // Examples
        if (command.metadata?.examples && command.metadata?.examples.length !== 0) {
          text += `\n**Examples:**\n${command.metadata.examples.join('\n')}`;
        }

        return text;
      }
    }

    // Display general help command
    const blocks: string[] = [];

    // Populate categories
    const categories: { [cat: string]: string[] } = {};
    this.client.commands.commands.forEach((command) => {
      if (typeof command.hasPermission(ctx, ctx.event) === 'string') return;
      const commandName = command.name;
      const category = command.category || 'Uncategorized';
      if (categories[category]) categories[category].push(commandName);
      else categories[category] = [commandName];
    });

    // List categories into fields
    keyValueForEach(categories, (cat, cmdNames) => {
      let cmds: string[] = [];
      let valueLength = 0;
      let fieldsPushed = 0;
      cmdNames.forEach((name: string) => {
        const length = name.length + 4;
        if (valueLength + length > 1800) {
          fieldsPushed++;
          blocks.push(stripIndents`
            __**${truncate(cat, 200)} (${fieldsPushed})**__
            ${cmds.join(', ')}
          `);
          valueLength = 0;
          cmds = [];
        }

        cmds.push(`\`${name}\``);
        valueLength += length;
      });

      blocks.push(stripIndents`
        __**${fieldsPushed ? `${truncate(cat, 200)} (${fieldsPushed + 1})` : truncate(cat, 256)}**__
        ${cmds.join(', ')}
      `);
    });

    const messages = splitMessage(blocks.join('\n\n'));
    if (messages.length === 1) return messages[0];
    try {
      const dm = await ctx.author.openDM();
      for (const content of messages) await dm.sendMessage(content);
      if (ctx.server) return 'Sent you a DM with information.';
    } catch (e) {
      return 'Unable to send you the help DM. You probably have DMs disabled.';
    }
  }
}
