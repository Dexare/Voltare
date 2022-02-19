import Collection from '@discordjs/collection';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import VoltareClient from '../../client/index.js';
import { ClientEvent } from '../../client/events.js';
import VoltareModule from '../../module.js';
import { iterateFolder } from '../../util/index.js';
import VoltareCommand from './command.js';
import CommandContext from './context.js';
import ArgumentInterpreter from './interpreter.js';
import { Message } from 'revolt.js/dist/maps/Messages';
import { ChannelPermission, ServerPermission } from 'revolt.js/dist/api/permissions';

import EvalCommand from './default/eval.js';
import HelpCommand from './default/help.js';
import PingCommand from './default/ping.js';
import ExecCommand from './default/exec.js';
import KillCommand from './default/kill.js';
import LoadCommand from './default/load.js';
import UnloadCommand from './default/unload.js';
import ReloadCommand from './default/reload.js';

/** The default command names available. */
export type DefaultCommand = 'eval' | 'help' | 'ping' | 'exec' | 'kill' | 'load' | 'unload' | 'reload';

/** The commands module in Voltare. */
export default class CommandsModule<T extends VoltareClient<any>> extends VoltareModule<T> {
  /** The commands loaded into the module. */
  readonly commands = new Collection<string, VoltareCommand>();

  constructor(client: T) {
    super(client, {
      name: 'commands',
      description: "Voltare's command handler."
    });

    this.filePath = fileURLToPath(import.meta.url);
  }

  /** @hidden */
  load() {
    this.registerEvent('message', this.onMessage.bind(this));
  }

  /** @hidden */
  unload() {
    this.unregisterAllEvents();
  }

  /**
   * Registers a command.
   * @param command The command to register
   */
  register(command: any) {
    if (typeof command === 'function') command = new command(this.client);
    else if (typeof command.default === 'function') command = new command.default(this.client);

    if (!(command instanceof VoltareCommand))
      throw new Error(`Invalid command object to register: ${command}`);

    // Make sure there aren't any conflicts
    if (this.commands.some((cmd) => cmd.name === command.name || cmd.aliases.includes(command.name))) {
      throw new Error(`A command with the name/alias "${command.name}" is already registered.`);
    }
    for (const alias of command.aliases) {
      if (this.commands.some((cmd) => cmd.name === alias || cmd.aliases.includes(alias))) {
        throw new Error(`A command with the name/alias "${alias}" is already registered.`);
      }
    }

    command.preload();
    this.commands.set(command.name, command);
    this.logger.log(`Registered command ${command.name}.`);
    return command;
  }

  /**
   * Registers commands from a folder.
   * @param path The path to register from.
   */
  registerFromFolder(path: string) {
    return iterateFolder(path, async (file) => this.register(await import(join(process.cwd(), file))));
  }

  /**
   * Re-registers a command.
   * @param command The new command
   * @param oldCommand The old command
   */
  reregister(command: any, oldCommand: VoltareCommand) {
    if (typeof command === 'function') command = new command(this.client);
    else if (typeof command.default === 'function') command = new command.default(this.client);

    if (!(command instanceof VoltareCommand))
      throw new Error(`Invalid command object to register: ${command}`);

    if (command.name !== oldCommand.name) throw new Error('Command name cannot change.');

    command.preload();
    this.commands.set(command.name, command);
    this.logger.log(`Reregistered command ${command.name}.`);
  }

  /**
   * Unregisters a command.
   * @param command The command to unregister
   */
  unregister(command: VoltareCommand) {
    this.commands.delete(command.name);
    this.logger.log(`Unregistered command ${command.name}.`);
  }

  /**
   * Find commands with a query.
   * @param searchString The string to search with
   * @param ctx The context to check with
   */
  find(searchString: string, ctx?: CommandContext) {
    if (!searchString) {
      return ctx
        ? Array.from(this.commands.filter((cmd) => cmd.isUsable(ctx)).values())
        : Array.from(this.commands.values());
    }
    const matchedCommands = Array.from(
      this.commands
        .filter(
          (cmd) =>
            cmd.name === searchString || (cmd.aliases && cmd.aliases.some((ali) => ali === searchString))
        )
        .values()
    );

    return matchedCommands;
  }

  /**
   * Registers default commands. (eval, help, ping)
   * @param commands The commands to register, if not defined, all commands are used.
   */
  registerDefaults(commands?: DefaultCommand[]) {
    if (!commands) commands = ['eval', 'help', 'ping', 'exec', 'kill', 'load', 'unload', 'reload'];

    if (commands.includes('eval')) this.register(EvalCommand);
    if (commands.includes('help')) this.register(HelpCommand);
    if (commands.includes('ping')) this.register(PingCommand);
    if (commands.includes('exec')) this.register(ExecCommand);
    if (commands.includes('kill')) this.register(KillCommand);
    if (commands.includes('load')) this.register(LoadCommand);
    if (commands.includes('unload')) this.register(UnloadCommand);
    if (commands.includes('reload')) this.register(ReloadCommand);
  }

  /** @hidden */
  private _escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** @hidden */
  private _buildPrefixes(event: ClientEvent) {
    const prefixes: string[] = [];
    let useMentionPrefix = false;
    let caseSensitive = false;

    if (event.has('prefix')) {
      const eventPrefixes = event.get('prefix');
      if (Array.isArray(eventPrefixes)) prefixes.push(...eventPrefixes);
      else prefixes.push(eventPrefixes);
    }

    if (this.client.config.prefix && !event.has('skipConfigPrefix')) {
      const configPrefixes = this.client.config.prefix;
      if (Array.isArray(configPrefixes)) prefixes.push(...configPrefixes);
      else prefixes.push(configPrefixes);
    }

    if ((this.client.config.mentionPrefix && !event.has('skipConfigPrefix')) || event.has('mentionPrefix'))
      useMentionPrefix = true;

    if (this.client.config.caseSensitivePrefix || event.has('caseSensitivePrefix')) caseSensitive = true;

    if (!prefixes.length && !useMentionPrefix) return;

    const escapedPrefixes = prefixes.map(this._escapeRegExp);

    if (useMentionPrefix) escapedPrefixes.push(`<@${this.client.bot.user!._id}>`);

    return new RegExp(`^(?<prefix>${escapedPrefixes.join('|')})(?<space> )?`, caseSensitive ? '' : 'i');
  }

  /** @hidden */
  private _logCommand(level: string, command: VoltareCommand, ...args: any[]) {
    return this.client.emit('logger', level, this.options.name, args, {
      command
    });
  }

  /** @hidden */
  private async onMessage(event: ClientEvent, message: Message) {
    if (
      message.author_id === '00000000000000000000000000' ||
      typeof message.content !== 'string' ||
      !message.channel
    )
      return;
    if (!(message.channel.permission & ChannelPermission.SendMessage)) return;

    // TODO Better bot exclusion
    if (message.author_id === this.client.bot.user!._id) return;

    const prefixRegex = this._buildPrefixes(event);
    if (!prefixRegex) return;

    const match = prefixRegex.exec(message.content);
    if (!message.content || !match) return;

    const prefixUsed = match.groups!.prefix;
    const strippedContent = message.content.substr(match[0].length);
    const argInterpretor = new ArgumentInterpreter(strippedContent);
    const args = argInterpretor.parseAsStrings();
    const commandName = args.splice(0, 1)[0];
    const ctx = new CommandContext(this, event, args, prefixUsed, message);
    const command = this.find(commandName, ctx)[0];

    event.set('commands/invoked', !commandName || !command);
    if (!commandName || !command) return;

    event.set('commands/prefixMatch', match);
    event.set('commands/spacedPrefix', !!match.groups?.space);
    event.set('commands/strippedContent', strippedContent);
    event.set('commands/commandName', commandName);
    event.set('commands/command', command);
    event.set('commands/ctx', ctx);

    // Ensure the user has permission to use the command
    const hasPermission = command.hasPermission(ctx);
    if (!hasPermission || typeof hasPermission === 'string') {
      const data = {
        response: typeof hasPermission === 'string' ? hasPermission : undefined
      };
      await command.onBlock(ctx, 'permission', data);
      return;
    }

    // Ensure the client user has the required channel permissions
    if (message.channel && command.clientChannelPermissions) {
      const perms = this.client.permissions.getChannelPerms(message.channel, this.client.bot.user!);
      const missing = command.clientChannelPermissions.filter((perm) => !(perms & ChannelPermission[perm]));
      if (missing.length > 0) {
        const data = { missing };
        await command.onBlock(ctx, 'clientChannelPermissions', data);
        return;
      }
    }

    // Ensure the client user has the required server permissions
    if (message.channel && message.channel.server && command.clientServerPermissions) {
      const perms = this.client.permissions.getServerPerms(message.channel.server, this.client.bot.user!);
      const missing = command.clientServerPermissions.filter((perm) => !(perms & ServerPermission[perm]));
      if (missing.length > 0) {
        const data = { missing };
        await command.onBlock(ctx, 'clientServerPermissions', data);
        return;
      }
    }

    // Throttle the command
    if (command.throttling) {
      const throttle = await command.throttle(ctx.message);
      if (throttle && !throttle.okay) {
        const remaining = throttle.reset ? (throttle.reset - Date.now()) / 1000 : null;
        const data = { throttle, remaining };
        command.onBlock(ctx, 'throttling', data);
        return;
      }
    }

    // Run the command
    try {
      this._logCommand(
        'debug',
        command,
        `Running command '${command.name}' (${ctx.author.username}, ${ctx.author._id})`
      );
      const promise = command.run(ctx);
      const retVal = await promise;
      await command.finalize(retVal, ctx);
    } catch (err) {
      try {
        await command.onError(err as Error, ctx);
      } catch (secondErr) {
        this._logCommand('error', command, command.name, secondErr);
      }
    }
  }
}
