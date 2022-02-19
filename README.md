<div align="center">

# Voltare

[![NPM version](https://img.shields.io/npm/v/voltare?maxAge=3600?&color=2ed573)](https://www.npmjs.com/package/voltare) [![NPM downloads](https://img.shields.io/npm/dt/voltare?maxAge=3600&color=2ed573)](https://www.npmjs.com/package/voltare) [![ESLint status](https://github.com/Dexare/Voltare/workflows/ESLint/badge.svg)](https://github.com/Dexare/Voltare/actions?query=workflow%3A%22ESLint%22)

</div>

Voltare is a version of the [Dexare](https://github.com/Dexare/Dexare) framework for [Revolt](https://revolt.chat). Easily make modules that depend on others or overwrite their functions.

Per [revolt.js's README](https://github.com/revoltchat/revolt.js#example-usage-javascript--es6), you must use the `--experimental-specifier-resolution=node` when running scripts.
Example: `node --experimental-specifier-resolution=node index.js`

> Note: This is still in development. As [revolt.js](https://github.com/revoltchat/revolt.js) is still in beta, this framework may have some bugs.

Documentation is unavailable at the moment, but some of the core features of Voltare is taken from the [Documentation for Dexare](https://github.com/Dexare/Dexare/wiki).

### Client Example
```js
import { VoltareClient } from 'voltare';

const client = new VoltareClient({
  login: {
    type: 'bot',
    // Your bot's token
    token: ''
  },
  // A prefix to use, can be a string or an array of strings
  prefix: '!',
  // Whether to include a mention as a prefix, defaults to false
  mentionPrefix: true,
  // Enter your ID here, can be a string or an array of strings
  elevated: '01FE...'
});

// This logs important Revolt events to the `logger` event.
client.logRevoltEvents();

// Logs things from the `logger` event to console in the debug level, can be ither `debug`, `info`, `warn` or `error`.
client.logToConsole('info');

// Registers all commands in a folder (don't use with ts-node)
client.commands.registerFromFolder('./commands');
// You can register a single command with `client.commands.register(HelloCommand)`.

// Registers default commands listed below, you can pass an array of strings to select commands to register,
// 'eval', 'help', 'ping', 'exec', 'kill', 'load', 'unload', 'reload';
client.commands.registerDefaults();

// Connect!
client.connect();
```
