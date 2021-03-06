import { exec } from 'child_process';
import { fileURLToPath } from 'node:url';
import VoltareClient from '../../../client/index.js';
import VoltareCommand from '../command.js';
import CommandContext from '../context.js';

export default class ExecCommand extends VoltareCommand {
  constructor(client: VoltareClient<any>) {
    super(client, {
      name: 'exec',
      description: 'Executes terminal commands with child_process.exec.',
      category: 'Developer',
      userPermissions: ['voltare.elevated'],
      metadata: {
        examples: ['exec echo hi'],
        usage: '<command>'
      }
    });

    this.filePath = fileURLToPath(import.meta.url);
  }

  async run(ctx: CommandContext) {
    let execString: string = ctx.event
      .get('commands/strippedContent')
      .trim()
      .slice(ctx.event.get('commands/commandName') + 1);

    if (execString.startsWith('```') && execString.endsWith('```'))
      execString = execString.replace(/(^.*?\s)|(\n.*$)/g, '');

    if (!execString) return 'This command requires something to execute.';

    ctx.channel.startTyping();
    const hrStart = process.hrtime();
    exec(execString, (err, stdout, stderr) => {
      ctx.channel.stopTyping();
      if (err) return ctx.send(`Error while executing: \`\`\`${err}\`\`\``);
      const hrDiff = process.hrtime(hrStart);
      ctx.send(
        `*Executed in ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.*\n` +
          (stderr ? `\`\`\`js\n${stderr}\n\`\`\`\n` : '') +
          `\`\`\`\n${stdout}\n\`\`\``
      );
    });
  }
}
